import { Prisma, Tracker } from "@prisma/client";
import prisma from "~/server/prisma";
import { TrackerUpdateInput, TrackerData } from "~/server/types/tracker";

import { useSocketServer } from "~/server/utils/websocket";
const { sendMessage } = useSocketServer();

interface ResponseSuccess {
  success: true;
  tracker: TrackerData;
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

    const body = await readBody<TrackerUpdateInput>(event);

    if (body.id !== Number(event.context.params?.id)) {
      return { success: false, message: `ID in body does not match url path` };
    }

    if (!body?.name) {
      return { success: false, message: `Tracker does not have a name` };
    }

    try {
      const tracker = await prisma.tracker.update({
        where: { id: Number(event.context.params.id) },
        data: {
          name: body?.name,
          scoreModifier: body?.scoreModifier,
        },
      });
      const trackerData: TrackerData = {
        id: tracker.id,
        name: tracker.name,
        scoreModifier: tracker.scoreModifier,
      };

      sendMessage("tracker", {
        type: "tracker",
        action: "update",
        tracker: trackerData,
      });

      return { success: true, tracker: trackerData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === "P2002") {
          return {
            success: false,
            message: `A tracker already exists with this name`,
          };
        }
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
