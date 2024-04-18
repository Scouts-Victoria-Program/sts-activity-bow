import { Prisma, BowAlert } from "@prisma/client";
import prisma from "~/server/prisma";
import { BowAlertData } from "~/server/types/bowAlert";

interface ResponseSuccess {
  success: true;
  bowAlert: BowAlertData;
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
      const bowAlert = await prisma.bowAlert.findUniqueOrThrow({
        where: { id: Number(event.context.params.id) },
      });
      const bowAlertData: BowAlertData = {
        id: bowAlert.id,
        datetime: bowAlert.datetime.toISOString(),
        faction: bowAlert.faction,
        expiry: bowAlert.expiry.toISOString(),
        description: bowAlert.description,
        baseId: bowAlert.baseId,
      };
      return { success: true, bowAlert: bowAlertData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
