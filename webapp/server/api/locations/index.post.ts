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
  trackerlocation: TrackerLocationData;
}
interface ResponseFailure {
  success: false;
  message: string;
}

export default defineEventHandler(
  async (event): Promise<ResponseSuccess | ResponseFailure> => {
    const body = await readBody<TrackerLocationCreateInput>(event);

    try {
      const trackerlocation = await prisma.trackerlocation.create({
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
      const trackerlocationData: TrackerLocationData = {
        id: trackerlocation.id,
        datetime: trackerlocation.datetime.toISOString(),
        windowSize: trackerlocation.windowSize,
        scoreModifier: trackerlocation.scoreModifier,
        lat: trackerlocation.lat,
        long: trackerlocation.long,
        trackerId: trackerlocation.trackerId,
        baseId: trackerlocation.baseId,
        distance: trackerlocation.distance,
      };

      sendMessage("trackerlocation", {
        type: "trackerlocation",
        action: "create",
        trackerlocation: trackerlocationData,
      });

      return { success: true, trackerlocation: trackerlocationData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === "P2002") {
          return {
            success: false,
            message: `A trackerlocation already exists with this name`,
          };
        }
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
