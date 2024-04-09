import { Prisma, Flag } from "@prisma/client";
import prisma from "~/server/prisma";
import { FlagUpdateInput, FlagData } from "~/server/types/flag";

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
    if (!event.context.params?.id) {
      return { success: false, message: "missing id in url" };
    }

    const body = await readBody<FlagUpdateInput>(event);

    if (body.id !== Number(event.context.params?.id)) {
      return { success: false, message: `ID in body does not match url path` };
    }

    try {
      const flag = await prisma.flag.update({
        where: { id: Number(event.context.params.id) },
        data: {
          datetime: body?.datetime,
          windowSize: body?.windowSize,
          scoreModifier: body?.scoreModifier,
          lat: body?.lat,
          long: body?.long,
          trackerId: body?.trackerId,
          baseId: body?.baseId,
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
        baseId: flag.baseId,
        distance: flag.distance,
      };

      sendMessage("flag", {
        type: "flag",
        action: "update",
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
