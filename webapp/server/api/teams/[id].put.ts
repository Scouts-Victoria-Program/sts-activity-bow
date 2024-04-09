import { Prisma, Base } from "@prisma/client";
import prisma from "~/server/prisma";
import { BaseUpdateInput, BaseData } from "~/server/types/base";

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
    if (!event.context.params?.id) {
      return { success: false, message: "missing id in url" };
    }

    const body = await readBody<BaseUpdateInput>(event);

    if (body.id !== Number(event.context.params?.id)) {
      return { success: false, message: `ID in body does not match url path` };
    }

    if (!body?.name) {
      return { success: false, message: `Base does not have a name` };
    }

    try {
      const base = await prisma.base.update({
        where: { id: Number(event.context.params.id) },
        data: {
          name: body?.name,
          flagZoneLat: body?.flagZoneLat,
          flagZoneLong: body?.flagZoneLong,
        },
      });
      const baseData: BaseData = {
        id: base.id,
        name: base.name,
        flagZoneLat: base.flagZoneLat,
        flagZoneLong: base.flagZoneLong,
      };

      sendMessage("base", {
        type: "base",
        action: "update",
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
