import { Prisma } from "@prisma/client";
import prisma from "~/server/prisma";
import { BowAlertData } from "~/server/types/bowAlert";

interface ResponseSuccess {
  success: true;
  page: number;
  perPage: number;
  maxPages: number;
  maxItems: number;
  bowAlerts: BowAlertData[];
}
interface ResponseFailure {
  success: false;
  message: string;
}

export default defineEventHandler(
  async (event): Promise<ResponseSuccess | ResponseFailure> => {
    try {
      const params = getQuery(event);

      const page = Number(params.page) || 1;
      const perPage = 30;

      const bowAlerts = await prisma.bowAlert.findMany({
        skip: perPage * (page - 1),
        take: perPage,
        orderBy: {
          id: "desc",
        },
      });

      const bowAlertsCount = await prisma.bowAlert.count({});

      return {
        success: true,
        page: page,
        perPage: perPage,
        maxPages: Math.ceil(bowAlertsCount / perPage),
        maxItems: bowAlertsCount,
        bowAlerts: bowAlerts.map((bowAlert) => {
          const bowAlertData: BowAlertData = {
            id: bowAlert.id,
            datetime: bowAlert.datetime.toISOString(),
            faction: bowAlert.faction,
            expiry: bowAlert.expiry.toISOString(),
            description: bowAlert.description,
            baseId: bowAlert.baseId,
          };
          return bowAlertData;
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
