import { Prisma, Base } from "@prisma/client";
import prisma from "~/server/prisma";
import { BaseCreateInput, BaseData } from "~/server/types/base";

import { useSocketServer } from "~/server/utils/websocket";
const { sendMessage } = useSocketServer();

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
    const body = await readBody<BaseCreateInput>(event);

    if (!body?.name) {
      return { success: false, message: `Base does not have a name` };
    }

    try {
      const base = await prisma.base.create({
        data: {
          name: body?.name,
          trackerlocationZoneLat: body?.trackerlocationZoneLat,
          trackerlocationZoneLong: body?.trackerlocationZoneLong,
        },
      });
      const baseData: BaseData = {
        id: base.id,
        name: base.name,
        trackerlocationZoneLat: base.trackerlocationZoneLat,
        trackerlocationZoneLong: base.trackerlocationZoneLong,
      };

      sendMessage("base", {
        type: "base",
        action: "create",
        base: baseData,
      });

      return { success: true, base: baseData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === "P2002") {
          return {
            success: false,
            message: `A base already exists with this name`,
          };
        }
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
