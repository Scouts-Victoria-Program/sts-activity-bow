import { Prisma } from "@prisma/client";
import prisma from "~/server/prisma";
import { ActionData, ActionOptionKeys } from "~/server/types/action";

interface ResponseSuccess {
  success: true;
  page: number;
  perPage: number;
  maxPages: number;
  maxItems: number;
  actions: ActionData[];
}
interface ResponseFailure {
  success: false;
  message: string;
}

interface QueryParams {
  page: string;
  baseId?: string;
  action?: ActionOptionKeys;
}

export default defineEventHandler(
  async (event): Promise<ResponseSuccess | ResponseFailure> => {
    try {
      const config = useRuntimeConfig();
      const params = getQuery<Partial<QueryParams>>(event);

      const page = Number(params.page) || 1;
      const perPage = 30;

      const actions = await prisma.action.findMany({
        skip: perPage * (page - 1),
        take: perPage,
        orderBy: {
          datetime: "desc",
        },
        where: {
          baseId: params.baseId ? Number(params.baseId) : undefined,
          action: params.action ? params.action : undefined,
        },
      });

      const actionsCount = await prisma.action.count({
        where: {
          baseId: params.baseId ? Number(params.baseId) : undefined,
          action: params.action ? params.action : undefined,
        },
      });

      return {
        success: true,
        page: page,
        perPage: perPage,
        maxPages: Math.ceil(actionsCount / perPage),
        maxItems: actionsCount,
        actions: actions.map((action) => {
          const actionData: ActionData = {
            id: action.id,
            datetime: action.datetime.toISOString(),
            action: action.action as ActionData["action"],
            score: action.score,
            description: action.description,
            baseId: action.baseId,
          };
          return actionData;
        }),
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
