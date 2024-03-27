import { Prisma, TrackerLog } from "@prisma/client";
import prisma from "~/server/prisma";
import { LogData } from "~/server/types/log";

interface ResponseSuccess {
  success: true;
  log: LogData;
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
      const log = await prisma.trackerLog.findUniqueOrThrow({
        where: { id: Number(event.context.params.id) },
      });
      const logData: LogData = {
        id: log.id,
        datetime: log.datetime.toISOString(),
        lat: log.lat,
        long: log.long,
        trackerId: log.trackerId,
        teamId: log.teamId,
        distance: log.distance,
      };
      return { success: true, log: logData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
