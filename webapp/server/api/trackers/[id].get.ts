import { Prisma, Tracker } from "@prisma/client";
import prisma from "~/server/prisma";
import { TrackerData } from "~/server/types/tracker";

interface ResponseSuccess {
  success: true;
  tracker: TrackerData;
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
      const tracker = await prisma.tracker.findUniqueOrThrow({
        where: { id: Number(event.context.params.id) },
      });
      const trackerData: TrackerData = {
        id: tracker.id,
        deviceId: tracker.deviceId,
        name: tracker.name,
        scoreModifier: tracker.scoreModifier,
      };
      return { success: true, tracker: trackerData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
