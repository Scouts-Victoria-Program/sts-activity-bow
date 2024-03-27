import { Prisma, Action } from "@prisma/client";
import prisma from "~/server/prisma";
import { ActionData } from "~/server/types/action";

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

    try {
      const action = await prisma.action.findUniqueOrThrow({
        where: { id: Number(event.context.params.id) },
      });
      const actionData: ActionData = {
        id: action.id,
        datetime: action.datetime.toISOString(),
        action: action.action as ActionData["action"],
        score: action.score,
        description: action.description,
        teamId: action.teamId,
      };
      return { success: true, action: actionData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
