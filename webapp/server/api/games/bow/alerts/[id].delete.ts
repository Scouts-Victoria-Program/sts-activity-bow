import { Prisma, BowAlert } from "@prisma/client";
import prisma from "~/server/prisma";

import { useSocketServer } from "~/server/utils/websocket";
const { sendMessage } = useSocketServer();

interface ResponseSuccess {
  success: true;
  bowAlert: { id: number };
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
      const bowAlertId = Number(event.context.params.id);

      await prisma.bowAlert.delete({
        where: { id: bowAlertId },
      });

      sendMessage("bowAlert", {
        type: "bowAlert",
        action: "delete",
        bowAlertId: bowAlertId,
      });

      return { success: true, bowAlert: { id: bowAlertId } };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
