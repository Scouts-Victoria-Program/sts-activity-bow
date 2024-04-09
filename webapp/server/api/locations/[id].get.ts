import { Prisma, TrackerLocation } from "@prisma/client";
import prisma from "~/server/prisma";
import { TrackerLocationData } from "~/server/types/trackerLocation";

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
    if (!event.context.params?.id) {
      return { success: false, message: "missing id in url" };
    }

    try {
      const trackerLocation = await prisma.trackerLocation.findUniqueOrThrow({
        where: { id: Number(event.context.params.id) },
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
      return { success: true, trackerLocation: trackerLocationData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
