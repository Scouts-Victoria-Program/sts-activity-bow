import { Prisma } from "@prisma/client";
import prisma from "~/server/prisma";
import { BaseData } from "~/server/types/base";

interface ResponseSuccess {
  success: true;
  page: number;
  perPage: number;
  maxPages: number;
  maxItems: number;
  bases: BaseData[];
}
interface ResponseFailure {
  success: false;
  message: string;
}

export default defineEventHandler(
  async (event): Promise<ResponseSuccess | ResponseFailure> => {
    try {
      const params = getQuery(event);

      const page = Number(params.page) || 1;
      const perPage = 30;

      const bases = await prisma.base.findMany({
        skip: perPage * (page - 1),
        take: perPage,
      });

      const basesCount = await prisma.base.count({});

      return {
        success: true,
        page: page,
        perPage: perPage,
        maxPages: Math.ceil(basesCount / perPage),
        maxItems: basesCount,
        bases: bases.map((base) => {
          const baseData: BaseData = {
            id: base.id,
            name: base.name,
            trackerlocationZoneLat: base.trackerlocationZoneLat,
            trackerlocationZoneLong: base.trackerlocationZoneLong,
          };
          return baseData;
        }),
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
