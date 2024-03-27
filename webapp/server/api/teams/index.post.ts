import { Prisma, Team } from "@prisma/client";
import prisma from "~/server/prisma";
import { TeamCreateInput, TeamData } from "~/server/types/team";

import { useSocketServer } from "~/server/utils/websocket";
const { sendMessage } = useSocketServer();

interface ResponseSuccess {
  success: true;
  team: TeamData;
}
interface ResponseFailure {
  success: false;
  message: string;
}

export default defineEventHandler(
  async (event): Promise<ResponseSuccess | ResponseFailure> => {
    const body = await readBody<TeamCreateInput>(event);

    if (!body?.name) {
      return { success: false, message: `Team does not have a name` };
    }

    try {
      const team = await prisma.team.create({
        data: {
          name: body?.name,
          flagZoneLat: body?.flagZoneLat,
          flagZoneLong: body?.flagZoneLong,
        },
      });
      const teamData: TeamData = {
        id: team.id,
        name: team.name,
        flagZoneLat: team.flagZoneLat,
        flagZoneLong: team.flagZoneLong,
      };

      sendMessage("team", {
        type: "team",
        action: "create",
        team: teamData,
      });

      return { success: true, team: teamData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === "P2002") {
          return {
            success: false,
            message: `A team already exists with this name`,
          };
        }
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
