import { Prisma } from "@prisma/client";
import prisma from "~/server/prisma";
import { TrackerData } from "~/server/types/tracker";

interface ResponseSuccess {
  success: true;
  page: number;
  perPage: number;
  maxPages: number;
  maxItems: number;
  trackers: TrackerData[];
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

      const trackers = await prisma.tracker.findMany({
        skip: perPage * (page - 1),
        take: perPage,
      });

      const trackersCount = await prisma.tracker.count({});

      return {
        success: true,
        page: page,
        perPage: perPage,
        maxPages: Math.ceil(trackersCount / perPage),
        maxItems: trackersCount,
        trackers: trackers.map((tracker) => {
          const trackerData: TrackerData = {
            id: tracker.id,
            deviceId: tracker.deviceId,
            name: tracker.name,
            scoreModifier: tracker.scoreModifier,
          };
          return trackerData;
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
