import { Prisma } from "@prisma/client";
import prisma from "~/server/prisma";
import { TeamData } from "~/server/types/team";

interface ResponseSuccess {
  success: true;
  page: number;
  perPage: number;
  maxPages: number;
  maxItems: number;
  teams: TeamData[];
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

      const teams = await prisma.team.findMany({
        skip: perPage * (page - 1),
        take: perPage,
      });

      const teamsCount = await prisma.team.count({});

      return {
        success: true,
        page: page,
        perPage: perPage,
        maxPages: Math.ceil(teamsCount / perPage),
        maxItems: teamsCount,
        teams: teams.map((team) => {
          const teamData: TeamData = {
            id: team.id,
            name: team.name,
            flagZoneLat: team.flagZoneLat,
            flagZoneLong: team.flagZoneLong,
          };
          return teamData;
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
