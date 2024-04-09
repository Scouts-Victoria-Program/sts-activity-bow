import { Prisma, TrackerLocation } from "@prisma/client";
import prisma from "~/server/prisma";
import {
  TrackerLocationCreateInput,
  TrackerLocationData,
} from "~/server/types/trackerLocation";

import { useSocketServer } from "~/server/utils/websocket";
const { sendMessage } = useSocketServer();

interface ResponseSuccess {
  success: true;
  trackerLocation: TrackerLocationData;
}
interface ResponseFailure {
  success: false;
  message: string;
}

export default defineEventHandler(
  async (event): Promise<ResponseSuccess | ResponseFailure> => {
    const body = await readBody<TrackerLocationCreateInput>(event);

    try {
      const trackerLocation = await prisma.trackerLocation.create({
        data: {
          datetime: body?.datetime,
          windowSize: body?.windowSize,
          scoreModifier: body?.scoreModifier,
          lat: body?.lat,
          long: body?.long,
          trackerId: body?.trackerId,
          baseId: body?.baseId,
          distance: body?.distance,
        },
      });
      const trackerLocationData: TrackerLocationData = {
        id: trackerLocation.id,
        datetime: trackerLocation.datetime.toISOString(),
        windowSize: trackerLocation.windowSize,
        scoreModifier: trackerLocation.scoreModifier,
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

      return { success: true, trackerLocation: trackerLocationData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === "P2002") {
          return {
            success: false,
            message: `A trackerLocation already exists with this name`,
          };
        }
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
