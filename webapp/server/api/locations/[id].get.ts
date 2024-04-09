import { Prisma, TrackerLocation } from "@prisma/client";
import prisma from "~/server/prisma";
import { TrackerLocationData } from "~/server/types/trackerLocation";

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
    if (!event.context.params?.id) {
      return { success: false, message: "missing id in url" };
    }

    try {
      const trackerlocation = await prisma.trackerlocation.findUniqueOrThrow({
        where: { id: Number(event.context.params.id) },
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
      return { success: true, trackerlocation: trackerlocationData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
