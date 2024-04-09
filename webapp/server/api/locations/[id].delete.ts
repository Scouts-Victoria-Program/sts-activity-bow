import { Prisma, TrackerLocation } from "@prisma/client";
import prisma from "~/server/prisma";

import { useSocketServer } from "~/server/utils/websocket";
const { sendMessage } = useSocketServer();

interface ResponseSuccess {
  success: true;
  trackerlocation: { id: number };
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
      const trackerlocationId = Number(event.context.params.id);

      await prisma.trackerlocation.delete({
        where: { id: trackerlocationId },
      });

      sendMessage("trackerlocation", {
        type: "trackerlocation",
        action: "delete",
        trackerlocationId: trackerlocationId,
      });

      return { success: true, trackerlocation: { id: trackerlocationId } };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
