import { Prisma } from "@prisma/client";
import prisma from "~/server/prisma";
import { LogData } from "~/server/types/log";

interface ResponseSuccess {
  success: true;
  page: number;
  perPage: number;
  maxPages: number;
  maxItems: number;
  logs: LogData[];
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

      const logs = await prisma.trackerLog.findMany({
        skip: perPage * (page - 1),
        take: perPage,
        orderBy: {
          datetime: "desc",
        },
        where: {
          trackerId: params.trackerId ? Number(params.trackerId) : undefined,
          baseId: params.baseId ? Number(params.baseId) : undefined,
          distance: params.baseId
            ? { lte: config.public.flagCapturedDistance }
            : undefined,
        },
      });

      const logsCount = await prisma.trackerLog.count({
        where: {
          trackerId: params.trackerId ? Number(params.trackerId) : undefined,
          baseId: params.baseId ? Number(params.baseId) : undefined,
          distance: params.baseId
            ? { lte: config.public.flagCapturedDistance }
            : undefined,
        },
      });

      return {
        success: true,
        page: page,
        perPage: perPage,
        maxPages: Math.ceil(logsCount / perPage),
        maxItems: logsCount,
        logs: logs.map((log) => {
          const logData: LogData = {
            id: log.id,
            datetime: log.datetime.toISOString(),
            lat: log.lat,
            long: log.long,
            trackerId: log.trackerId,
            baseId: log.baseId,
            distance: log.distance,
          };
          return logData;
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
