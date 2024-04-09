import { Prisma, Flag } from "@prisma/client";
import prisma from "~/server/prisma";
import { FlagData } from "~/server/types/flag";

interface ResponseSuccess {
  success: true;
  flag: FlagData;
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
      const flag = await prisma.flag.findUniqueOrThrow({
        where: { id: Number(event.context.params.id) },
      });
      const flagData: FlagData = {
        id: flag.id,
        datetime: flag.datetime.toISOString(),
        windowSize: flag.windowSize,
        scoreModifier: flag.scoreModifier,
        lat: flag.lat,
        long: flag.long,
        trackerId: flag.trackerId,
        baseId: flag.baseId,
        distance: flag.distance,
      };
      return { success: true, flag: flagData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
