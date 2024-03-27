import { Prisma, Action } from "@prisma/client";
import prisma from "~/server/prisma";
import { ActionUpdateInput, ActionData } from "~/server/types/action";

import { useSocketServer } from "~/server/utils/websocket";
const { sendMessage } = useSocketServer();

interface ResponseSuccess {
  success: true;
  action: ActionData;
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

    const body = await readBody<ActionUpdateInput>(event);

    if (body.id !== Number(event.context.params?.id)) {
      return { success: false, message: `ID in body does not match url path` };
    }

    try {
      const action = await prisma.action.update({
        where: { id: Number(event.context.params.id) },
        data: {
          datetime: body?.datetime,
          action: body?.action,
          score: body?.score,
          description: body?.description,
          teamId: body?.teamId,
        },
      });
      const actionData: ActionData = {
        id: action.id,
        datetime: action.datetime.toISOString(),
        action: action.action as ActionData["action"],
        score: action.score,
        teamId: action.teamId,
        description: action.description,
      };

      sendMessage("action", {
        type: "action",
        action: "update",
        actionData: actionData,
      });

      return { success: true, action: actionData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === "P2002") {
          return {
            success: false,
            message: `A action already exists with this name`,
          };
        }
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
