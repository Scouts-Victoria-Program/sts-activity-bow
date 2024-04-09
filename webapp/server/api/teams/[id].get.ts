import { Prisma, Base } from "@prisma/client";
import prisma from "~/server/prisma";
import { BaseData } from "~/server/types/base";

interface ResponseSuccess {
  success: true;
  base: BaseData;
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
      const base = await prisma.base.findUniqueOrThrow({
        where: { id: Number(event.context.params.id) },
      });
      const baseData: BaseData = {
        id: base.id,
        name: base.name,
        trackerlocationZoneLat: base.trackerlocationZoneLat,
        trackerlocationZoneLong: base.trackerlocationZoneLong,
      };
      return { success: true, base: baseData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
