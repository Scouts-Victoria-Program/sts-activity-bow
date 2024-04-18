import { Prisma, BowAlert } from "@prisma/client";
import prisma from "~/server/prisma";
import { BowAlertUpdateInput, BowAlertData } from "~/server/types/bowAlert";

import { useSocketServer } from "~/server/utils/websocket";
const { sendMessage } = useSocketServer();

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

    const body = await readBody<BowAlertUpdateInput>(event);

    if (body.id !== Number(event.context.params?.id)) {
      return { success: false, message: `ID in body does not match url path` };
    }

    if (!body?.datetime) {
      return { success: false, message: `BowAlert does not have a datetime` };
    }
    if (!body?.faction) {
      return { success: false, message: `BowAlert does not have a faction` };
    }
    if (!body?.expiry) {
      return { success: false, message: `BowAlert does not have a expiry` };
    }
    if (!body?.description) {
      return {
        success: false,
        message: `BowAlert does not have a description`,
      };
    }
    if (!body?.baseId) {
      return { success: false, message: `BowAlert does not have a baseId` };
    }

    try {
      const bowAlert = await prisma.bowAlert.update({
        where: { id: Number(event.context.params.id) },
        data: {
          datetime: body?.datetime,
          faction: body?.faction,
          expiry: body?.expiry,
          description: body?.description,
          baseId: body?.baseId,
        },
      });
      const bowAlertData: BowAlertData = {
        id: bowAlert.id,
        datetime: bowAlert.datetime.toISOString(),
        faction: bowAlert.faction,
        expiry: bowAlert.expiry.toISOString(),
        description: bowAlert.description,
        baseId: bowAlert.baseId,
      };

      sendMessage("bowAlert", {
        type: "bowAlert",
        action: "update",
        bowAlert: bowAlertData,
      });

      return { success: true, bowAlert: bowAlertData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === "P2002") {
          return {
            success: false,
            message: `A bowAlert already exists with this name`,
          };
        }
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
