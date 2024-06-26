import { Prisma, Base } from "@prisma/client";
import prisma from "~/server/prisma";

import { useSocketServer } from "~/server/utils/websocket";
const { sendMessage } = useSocketServer();

interface ResponseSuccess {
  success: true;
  base: { id: number };
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
      const baseId = Number(event.context.params.id);

      await prisma.base.delete({
        where: { id: baseId },
      });

      sendMessage("base", {
        type: "base",
        action: "delete",
        baseId: baseId,
      });

      return { success: true, base: { id: baseId } };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
