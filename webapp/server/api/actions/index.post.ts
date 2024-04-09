import { Prisma, Action } from "@prisma/client";
import prisma from "~/server/prisma";
import { ActionCreateInput, ActionData } from "~/server/types/action";

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
    const body = await readBody<ActionCreateInput>(event);

    try {
      const action = await prisma.action.create({
        data: {
          datetime: body?.datetime,
          action: body?.action,
          score: body?.score,
          description: body?.description,
          baseId: body?.baseId,
        },
      });
      const actionData: ActionData = {
        id: action.id,
        datetime: action.datetime.toISOString(),
        action: action.action as ActionData["action"],
        score: action.score,
        description: action.description,
        baseId: action.baseId,
      };

      sendMessage("action", {
        type: "action",
        action: "create",
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
