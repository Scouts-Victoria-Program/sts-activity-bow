import { Prisma, Tracker } from "@prisma/client";
import prisma from "~/server/prisma";

import { useSocketServer } from "~/server/utils/websocket";
const { sendMessage } = useSocketServer();

interface ResponseSuccess {
  success: true;
  tracker: { id: number };
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
      const trackerId = Number(event.context.params.id);
      await prisma.tracker.delete({
        where: { id: trackerId },
      });

      sendMessage("tracker", {
        type: "tracker",
        action: "delete",
        trackerId: trackerId,
      });

      return {
        success: true,
        tracker: { id: trackerId },
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
