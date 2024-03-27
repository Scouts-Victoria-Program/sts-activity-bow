import { Prisma, Flag } from "@prisma/client";
import prisma from "~/server/prisma";

import { useSocketServer } from "~/server/utils/websocket";
const { sendMessage } = useSocketServer();

interface ResponseSuccess {
  success: true;
  flag: { id: number };
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
      const flagId = Number(event.context.params.id);

      await prisma.flag.delete({
        where: { id: flagId },
      });

      sendMessage("flag", {
        type: "flag",
        action: "delete",
        flagId: flagId,
      });

      return { success: true, flag: { id: flagId } };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
