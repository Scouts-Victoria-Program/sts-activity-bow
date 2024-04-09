import { Prisma } from "@prisma/client";
import { connect } from "mqtt";
import prisma from "~/server/prisma";
import { LogData } from "~/server/types/log";
import {
  MqttTrackerMessage,
  MqttTrackerMessageJoin,
  MqttTrackerMessageUp,
} from "~/server/types/mqtt";
import { DateTime } from "luxon";

interface ParsedUplinkMessage {
  trackerId: string;
  lat: number;
  long: number;
}

interface ClosestBase {
  id: number;
  distance: number;
}

interface FlagToInsert {
  datetime: Date;
  windowSize: number;
  scoreModifier: number;
  lat: number;
  long: number;
  trackerId: number;
  baseId: number | null;
  distance: number;
}

import { useSocketServer } from "~/server/utils/websocket";
import { FlagData } from "~/server/types/flag";
const { sendMessage } = useSocketServer();

const config = useRuntimeConfig();

const client = connect(config.mqtt.host, {
  username: config.mqtt.username,
  password: config.mqtt.password,
});

client.on("connect", () => {
  client.subscribe(`v3/${config.mqtt.username}/devices/#`, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Connected to MQTT");
    }
  });
});

client.on("message", async (topic, message) => {
  console.log(`MQTT message received:`, topic, message.toString());

  await handleTrackerMessage(
    JSON.parse(message.toString()) as unknown as MqttTrackerMessage
  );
});

async function handleTrackerMessage(message: MqttTrackerMessage) {
  if ("join_accept" in message) {
    await handleTrackerMessageJoin(message);
  }
  if ("uplink_message" in message) {
    await handleTrackerMessageUp(message);
  }
}
function handleTrackerMessageJoin(message: MqttTrackerMessageJoin) {}
async function handleTrackerMessageUp(message: MqttTrackerMessageUp) {
  const uplinkMessage = parseUpLinkMessage(message);

  // Get tracker from message.
  const trackerData = await prisma.tracker.findUniqueOrThrow({
    where: {
      name: uplinkMessage.trackerId,
    },
  });

  // Calculate current tracker zone/base base.
  const closestBase = await getClosestBaseFlagZoneByLatLong(
    uplinkMessage.lat,
    uplinkMessage.long
  );

  console.log(
    `GPS trace logged: tracker ${trackerData.name} base ${closestBase.id} distance ${closestBase.distance}`
  );

  // Log data point.
  await insertLog({ uplinkMessage, trackerData, closestBase });

  const flagWindows = await generateFlagWindows({
    uplinkMessage,
    trackerData,
    closestBase,
  });
  await insertFlags(flagWindows);
}

async function insertLog(context: {
  uplinkMessage: ParsedUplinkMessage;
  trackerData: { id: number };
  closestBase: ClosestBase;
}) {
  const log = await prisma.trackerLog.create({
    data: {
      datetime: new Date(Date.now()),
      lat: context.uplinkMessage.lat,
      long: context.uplinkMessage.long,
      baseId: context.closestBase.id,
      trackerId: context.trackerData.id,
      distance: context.closestBase.distance,
    },
  });

  // Send update via websocket.
  const logData: LogData = {
    id: log.id,
    datetime: log.datetime.toISOString(),
    lat: log.lat,
    long: log.long,
    trackerId: log.trackerId,
    baseId: log.baseId,
    distance: log.distance,
  };
  sendMessage("log", {
    type: "log",
    action: "create",
    log: logData,
  });
}

async function generateFlagWindows(context: {
  uplinkMessage: ParsedUplinkMessage;
  trackerData: { id: number; scoreModifier: number };
  closestBase: ClosestBase;
}): Promise<FlagToInsert[]> {
  const config = useRuntimeConfig();
  const interval = config.public.flagWindowIntervalMinutes;

  const flags: FlagToInsert[] = [];

  const previousFlag = await prisma.flag.findFirst({
    where: { trackerId: context.trackerData.id },
    orderBy: { datetime: "desc" },
    take: 1,
  });

  if (!previousFlag) {
    // insert current log as first flag.
    flags.push(buildFlag(interval, DateTime.now(), context));

    return flags;
  }

  const windowedNow = windowDateTime(interval, DateTime.now());

  const previousDatetime = DateTime.fromJSDate(previousFlag.datetime);

  let windowedDatetime = windowDateTime(interval, previousDatetime).plus({
    minutes: config.public.flagWindowIntervalMinutes,
  });

  // Check if current time window is newer than the "keep alive time" ago.
  // If it is older, then we dont want to fill in all the gaps and just want
  // a new "first" trace recorded.
  const flagKeepAliveMinutesAgo = config.public.flagKeepAliveMinutes * -1.05;
  if (flagKeepAliveMinutesAgo < minutesDiff(windowedDatetime, windowedNow)) {
    // If the difference in minutes is negative, the trace is in the past and does not
    // clash with the current bucket time, then create a flag object for that window.
    while (minutesDiff(windowedDatetime, windowedNow) < 0) {
      flags.push(buildFlag(interval, windowedDatetime, { previousFlag }));

      windowedDatetime = windowedDatetime.plus({
        minutes: config.public.flagWindowIntervalMinutes,
      });
    }
  }

  flags.push(buildFlag(interval, windowedNow, context));

  return flags;
}

function minutesDiff(candidateWindow: DateTime, nowWindow: DateTime): number {
  return candidateWindow.diff(nowWindow, "minutes").minutes;
}

function buildFlag(
  interval: number,
  datetime: DateTime,
  context:
    | {
        uplinkMessage: ParsedUplinkMessage;
        trackerData: { id: number; scoreModifier: number };
        closestBase: ClosestBase;
      }
    | { previousFlag: FlagToInsert }
): FlagToInsert {
  if ("previousFlag" in context) {
    return {
      datetime: windowDateTime(interval, datetime).toJSDate(),
      windowSize: context.previousFlag.windowSize,
      scoreModifier: context.previousFlag.scoreModifier,
      lat: context.previousFlag.lat,
      long: context.previousFlag.long,
      trackerId: context.previousFlag.trackerId,
      baseId: context.previousFlag.baseId,
      distance: context.previousFlag.distance,
    };
  }

  return {
    datetime: windowDateTime(interval, datetime).toJSDate(),
    windowSize: interval,
    scoreModifier: context.trackerData.scoreModifier,
    lat: context.uplinkMessage.lat,
    long: context.uplinkMessage.long,
    trackerId: context.trackerData.id,
    baseId: context.closestBase.id,
    distance: context.closestBase.distance,
  };
}

function windowDateTime(interval: number, datetime: DateTime): DateTime {
  const rountedDownMinutes = Math.floor(datetime.minute / interval) * interval;

  return datetime.set({
    minute: rountedDownMinutes,
    second: 0,
    millisecond: 0,
  });
}

async function insertFlags(flagsToInsert: FlagToInsert[]) {
  for (const flagToInsert of flagsToInsert) {
    const flag = await prisma.flag.create({
      data: flagToInsert,
    });

    // Send update via websocket.
    const flagData: FlagData = {
      id: flag.id,
      datetime: flag.datetime.toISOString(),
      scoreModifier: flag.scoreModifier,
      windowSize: flag.windowSize,
      lat: flag.lat,
      long: flag.long,
      trackerId: flag.trackerId,
      baseId: flag.baseId,
      distance: flag.distance,
    };
    sendMessage("flag", {
      type: "flag",
      action: "create",
      flag: flagData,
    });
  }
}

function parseUpLinkMessage(
  message: MqttTrackerMessageUp
): ParsedUplinkMessage {
  const uplink = message.uplink_message.decoded_payload;

  if (!uplink.latitude || !uplink.longitude) {
    console.log(
      `GPS trace missing lat or long ${
        message.end_device_ids.device_id
      } ${JSON.stringify(uplink)}`
    );
    throw new Error(
      `GPS trace missing lat or long ${
        message.end_device_ids.device_id
      } ${JSON.stringify(uplink)}`
    );
  }

  return {
    trackerId: message.end_device_ids.device_id,
    lat: uplink.latitude,
    long: uplink.longitude,
  };
}

async function getClosestBaseFlagZoneByLatLong(
  lat: number,
  long: number
): Promise<ClosestBase> {
  try {
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS cube;`;
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS earthdistance;`;

    const res4 = (await prisma.$queryRaw`SELECT 
      id, earth_distance(
        ll_to_earth(t."flagZoneLat", t."flagZoneLong"),
        ll_to_earth(${lat}, ${long})
      ) as distance
     FROM "Base" as t
     ORDER BY distance ASC
     LIMIT 1
     `) as ClosestBase[];

    return { id: res4[0].id, distance: res4[0].distance };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
    }

    throw e;
  }
}
