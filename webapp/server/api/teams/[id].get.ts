import { Prisma, Team } from "@prisma/client";
import prisma from "~/server/prisma";
import { TeamData } from "~/server/types/team";

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
    if (!event.context.params?.id) {
      return { success: false, message: "missing id in url" };
    }

    try {
      const team = await prisma.team.findUniqueOrThrow({
        where: { id: Number(event.context.params.id) },
      });
      const teamData: TeamData = {
        id: team.id,
        name: team.name,
        flagZoneLat: team.flagZoneLat,
        flagZoneLong: team.flagZoneLong,
      };
      return { success: true, team: teamData };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);
