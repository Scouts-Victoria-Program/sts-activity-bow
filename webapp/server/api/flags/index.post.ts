import { Prisma, Flag } from "@prisma/client";
import prisma from "~/server/prisma";
import { FlagCreateInput, FlagData } from "~/server/types/flag";

import { useSocketServer } from "~/server/utils/websocket";
const { sendMessage } = useSocketServer();

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
    const body = await readBody<FlagCreateInput>(event);

    try {
      const flag = await prisma.flag.create({
        data: {
          datetime: body?.datetime,
          windowSize: body?.windowSize,
          scoreModifier: body?.scoreModifier,
          lat: body?.lat,
          long: body?.long,
          trackerId: body?.trackerId,
          teamId: body?.teamId,
          distance: body?.distance,
        },
      });
      const flagData: FlagData = {
        id: flag.id,
        datetime: flag.datetime.toISOString(),
        windowSize: flag.windowSize,
        scoreModifier: flag.scoreModifier,
        lat: flag.lat,
        long: flag.long,
        trackerId: flag.trackerId,
        teamId: flag.teamId,
        distance: flag.distance,
      };

      sendMessage("flag", {
        type: "flag",
        action: "create",
        flag: flagData,
      });

      return { success: true, flag: flagData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === "P2002") {
          return {
            success: false,
            message: `A flag already exists with this name`,
          };
        }
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
