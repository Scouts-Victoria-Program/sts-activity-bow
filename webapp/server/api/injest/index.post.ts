import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import prisma from "~/server/prisma";
import { TrackerLocationData } from "~/server/types/trackerLocation";

import { useSocketServer } from "~/server/utils/websocket";
const { sendMessage } = useSocketServer();

interface ResponseSuccess {
  success: true;
}
interface ResponseFailure {
  success: false;
  message: string;
}

interface ClosestBase {
  id: number;
  distance: number;
}

interface TrackerLocationToInsert {
  datetime: Date;
  windowSize: number;
  scoreModifier: number;
  lat: number;
  long: number;
  trackerId: number;
  baseId: number | null;
  distance: number;
}

export type LoRaMessage = LoRaMessageJoin | LoRaMessageUp;

type LoRaMessageBase = {
  deviceId: string;
  datetime: string;
  topic: string;
};

type LoRaMessageJoin = LoRaMessageBase & {
  type: "join";
  success: boolean;
};

type LoRaMessageUp = LoRaMessageBase & {
  type: "up";
  latitude: number;
  longitude: number;
  battery: number;
  alarmStatus: boolean;
  ledEnabled: boolean;
  movementDetection: "Disable" | "Move" | "Collide" | "User";
  firmware: number;
};

export default defineEventHandler(
  async (event): Promise<ResponseSuccess | ResponseFailure> => {
    const body1 = await readBody<LoRaMessage>(event);

    const body =
      typeof body1 !== "string" ? body1 : (JSON.parse(body1) as LoRaMessage);

    if (body.type === "join") {
      return { success: true };
    }

    try {
      await handleLoRaMessageUp(body);

      return { success: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === "P2002") {
          return {
            success: false,
            message: `A trackerLocation already exists with this name`,
          };
        }
        if (e.code === "P2025") {
          return {
            success: false,
            message: `Tracker with deviceId ${body.deviceId} does not exist`,
          };
        }
      }

      if (e.message === "Missing Device Id") {
        console.log(body);
        return { success: false, message: `Missing Device Id` };
      }

      console.log(e);
      return { success: false, message: `an unknown error occurred` };
    }
  }
);

async function handleLoRaMessageUp(message: LoRaMessageUp) {
  if (!message.deviceId) {
    throw new Error("Missing Device Id");
  }

  // Get tracker from message.
  const trackerData = await prisma.tracker.findUniqueOrThrow({
    where: {
      deviceId: message.deviceId,
    },
  });

  // Calculate closest base to the tracker's location.
  const closestBase = await getClosestBaseByLatLong(
    message.latitude,
    message.longitude
  );

  console.log(
    `GPS trace logged: tracker ${trackerData.deviceId} base ${closestBase.id} distance ${closestBase.distance}`
  );

  const trackerLocationWindows = await generateTrackerLocationWindows({
    message,
    trackerData,
    closestBase,
  });
  await insertTrackerLocations(trackerLocationWindows);
}

async function generateTrackerLocationWindows(context: {
  message: LoRaMessageUp;
  trackerData: { id: number; scoreModifier: number };
  closestBase: ClosestBase;
}): Promise<TrackerLocationToInsert[]> {
  const config = useRuntimeConfig();
  const interval = config.public.trackerLocationWindowIntervalMinutes;

  const trackerLocations: TrackerLocationToInsert[] = [];

  const previousTrackerLocation = await prisma.trackerLocation.findFirst({
    where: { trackerId: context.trackerData.id },
    orderBy: { datetime: "desc" },
    take: 1,
  });

  const _parsedOrginDatetime = context.message.datetime
    ? DateTime.fromISO(context.message.datetime)
    : DateTime.now();

  const datetimeMessageOrigin: DateTime = _parsedOrginDatetime.isValid
    ? _parsedOrginDatetime
    : DateTime.now();

  if (!previousTrackerLocation) {
    // insert current log as first trackerLocation.
    trackerLocations.push(
      buildTrackerLocation(interval, datetimeMessageOrigin, context)
    );

    return trackerLocations;
  }

  const windowedNow = windowDateTime(interval, datetimeMessageOrigin);

  const previousDatetime = DateTime.fromJSDate(
    previousTrackerLocation.datetime
  );

  let windowedDatetime = windowDateTime(interval, previousDatetime).plus({
    minutes: config.public.trackerLocationWindowIntervalMinutes,
  });

  // Check if current time window is newer than the "keep alive time" ago.
  // If it is older, then we dont want to fill in all the gaps and just want
  // a new "first" trace recorded.
  const trackerLocationKeepAliveMinutesAgo =
    config.public.trackerLocationKeepAliveMinutes * -1.05;
  if (
    trackerLocationKeepAliveMinutesAgo <
    minutesDiff(windowedDatetime, windowedNow)
  ) {
    // If the difference in minutes is negative, the trace is in the past and does not
    // clash with the current bucket time, then create a trackerLocation object for that window.
    while (minutesDiff(windowedDatetime, windowedNow) < 0) {
      trackerLocations.push(
        buildTrackerLocation(interval, windowedDatetime, {
          previousTrackerLocation,
        })
      );

      windowedDatetime = windowedDatetime.plus({
        minutes: config.public.trackerLocationWindowIntervalMinutes,
      });
    }
  }

  trackerLocations.push(buildTrackerLocation(interval, windowedNow, context));

  return trackerLocations;
}

function minutesDiff(candidateWindow: DateTime, nowWindow: DateTime): number {
  return candidateWindow.diff(nowWindow, "minutes").minutes;
}

function buildTrackerLocation(
  interval: number,
  datetime: DateTime,
  context:
    | {
        message: LoRaMessageUp;
        trackerData: { id: number; scoreModifier: number };
        closestBase: ClosestBase;
      }
    | { previousTrackerLocation: TrackerLocationToInsert }
): TrackerLocationToInsert {
  if ("previousTrackerLocation" in context) {
    return {
      datetime: windowDateTime(interval, datetime).toJSDate(),
      windowSize: context.previousTrackerLocation.windowSize,
      scoreModifier: context.previousTrackerLocation.scoreModifier,
      lat: context.previousTrackerLocation.lat,
      long: context.previousTrackerLocation.long,
      trackerId: context.previousTrackerLocation.trackerId,
      baseId: context.previousTrackerLocation.baseId,
      distance: context.previousTrackerLocation.distance,
    };
  }

  return {
    datetime: windowDateTime(interval, datetime).toJSDate(),
    windowSize: interval,
    scoreModifier: context.trackerData.scoreModifier,
    lat: context.message.latitude,
    long: context.message.longitude,
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

async function insertTrackerLocations(
  trackerLocationsToInsert: TrackerLocationToInsert[]
) {
  for (const trackerLocationToInsert of trackerLocationsToInsert) {
    const trackerLocation = await prisma.trackerLocation.create({
      data: trackerLocationToInsert,
    });

    // Send update via websocket.
    const trackerLocationData: TrackerLocationData = {
      id: trackerLocation.id,
      datetime: trackerLocation.datetime.toISOString(),
      scoreModifier: trackerLocation.scoreModifier,
      windowSize: trackerLocation.windowSize,
      lat: trackerLocation.lat,
      long: trackerLocation.long,
      trackerId: trackerLocation.trackerId,
      baseId: trackerLocation.baseId,
      distance: trackerLocation.distance,
    };
    sendMessage("trackerLocation", {
      type: "trackerLocation",
      action: "create",
      trackerLocation: trackerLocationData,
    });
  }
}

async function getClosestBaseByLatLong(
  lat: number,
  long: number
): Promise<ClosestBase> {
  try {
    // await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS cube;`;
    // await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS earthdistance;`;

    const res4 = (await prisma.$queryRaw`SELECT 
      id, earth_distance(
        ll_to_earth(t."lat", t."long"),
        ll_to_earth(${lat}, ${long})
      ) as distance
     FROM "Base" as t
     ORDER BY distance ASC
     LIMIT 1
     `) as ClosestBase[];

    if (res4.length !== 1) {
      throw new Error("no closest base");
    }

    return { id: res4[0].id, distance: res4[0].distance };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
    }

    throw e;
  }
}
