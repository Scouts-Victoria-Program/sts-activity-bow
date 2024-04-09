import { Prisma } from "@prisma/client";
import prisma from "~/server/prisma";
import { TrackerLocationData } from "~/server/types/trackerLocation";

interface ResponseSuccess {
  success: true;
  page: number;
  perPage: number;
  maxPages: number;
  maxItems: number;
  trackerLocations: TrackerLocationData[];
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

      const trackerLocations = await prisma.trackerLocation.findMany({
        skip: perPage * (page - 1),
        take: perPage,
        orderBy: {
          datetime: "desc",
        },
        where: {
          trackerId: params.trackerId ? Number(params.trackerId) : undefined,
          baseId: params.baseId ? Number(params.baseId) : undefined,
          distance: params.baseId
            ? { lte: config.public.trackerLocationCapturedDistance }
            : undefined,
        },
      });

      const trackerLocationsCount = await prisma.trackerLocation.count({
        where: {
          trackerId: params.trackerId ? Number(params.trackerId) : undefined,
          baseId: params.baseId ? Number(params.baseId) : undefined,
          distance: params.baseId
            ? { lte: config.public.trackerLocationCapturedDistance }
            : undefined,
        },
      });

      return {
        success: true,
        page: page,
        perPage: perPage,
        maxPages: Math.ceil(trackerLocationsCount / perPage),
        maxItems: trackerLocationsCount,
        trackerLocations: trackerLocations.map((trackerLocation) => {
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
          return trackerLocationData;
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
