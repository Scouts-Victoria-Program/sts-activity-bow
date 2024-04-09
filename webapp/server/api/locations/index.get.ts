import { Prisma } from "@prisma/client";
import prisma from "~/server/prisma";
import { TrackerLocationData } from "~/server/types/trackerlocation";

interface ResponseSuccess {
  success: true;
  page: number;
  perPage: number;
  maxPages: number;
  maxItems: number;
  trackerlocations: TrackerLocationData[];
}
interface ResponseFailure {
  success: false;
  message: string;
}

interface QueryParams {
  page: string;
  trackerId: string;
  baseId: string;
}

export default defineEventHandler(
  async (event): Promise<ResponseSuccess | ResponseFailure> => {
    try {
      const config = useRuntimeConfig();
      const params = getQuery<Partial<QueryParams>>(event);

      const page = Number(params.page) || 1;
      const perPage = 30;

      const trackerlocations = await prisma.trackerlocation.findMany({
        skip: perPage * (page - 1),
        take: perPage,
        orderBy: {
          datetime: "desc",
        },
        where: {
          trackerId: params.trackerId ? Number(params.trackerId) : undefined,
          baseId: params.baseId ? Number(params.baseId) : undefined,
          distance: params.baseId
            ? { lte: config.public.trackerlocationCapturedDistance }
            : undefined,
        },
      });

      const trackerlocationsCount = await prisma.trackerlocation.count({
        where: {
          trackerId: params.trackerId ? Number(params.trackerId) : undefined,
          baseId: params.baseId ? Number(params.baseId) : undefined,
          distance: params.baseId
            ? { lte: config.public.trackerlocationCapturedDistance }
            : undefined,
        },
      });

      return {
        success: true,
        page: page,
        perPage: perPage,
        maxPages: Math.ceil(trackerlocationsCount / perPage),
        maxItems: trackerlocationsCount,
        trackerlocations: trackerlocations.map((trackerlocation) => {
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
          return trackerlocationData;
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
