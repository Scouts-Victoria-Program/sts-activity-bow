import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "~/server/prisma";
import {
  StatSet,
  StatData,
  StatSetType,
  StatSetTypeKey,
} from "~/server/types/stat";
import { TeamData } from "~/server/types/team";
import { DateTime } from "luxon";

interface ResponseSuccess {
  success: true;
  stats: StatData;
}
interface ResponseFailure {
  success: false;
  message: string;
}

export default defineEventHandler(
  async (event): Promise<ResponseSuccess | ResponseFailure> => {
    try {
      const stats = await StatBuilder.Builder(prisma);

      return {
        success: true,
        stats: stats.stats as StatData,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
      }

      return { success: false, message: `an unknown error occurred` };
    }
  }
);

class StatBuilder {
  prisma: PrismaClient;

  stats: StatData | null = null;
  teams: TeamData[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  static async Builder(prisma: PrismaClient) {
    const statBuilder = new StatBuilder(prisma);

    await statBuilder.loadTeams();

    await statBuilder.generateStats();

    return statBuilder;
  }

  async loadTeams(): Promise<void> {
    const teams = await this.prisma.team.findMany({
      orderBy: {
        id: "asc",
      },
    });

    this.teams = teams.map((team) => {
      const teamData: TeamData = {
        id: team.id,
        name: team.name,
        flagZoneLat: team.flagZoneLat,
        flagZoneLong: team.flagZoneLong,
      };
      return teamData;
    });
  }

  async generateStats() {
    const teamStats: StatData["teams"] = [];

    for (const team of this.teams) {
      const teamStatManager = new TeamStatManager(team, this.prisma);
      await teamStatManager.generateStats();
      teamStats.push({
        id: team.id,
        stats: teamStatManager.stats,
        score: teamStatManager.totalScore,
      });
    }

    this.stats = {
      statTypes: StatSetType,
      teams: teamStats,
    };
  }
}

class TeamStatManager {
  team: TeamData;
  prisma: PrismaClient;

  stats: Record<StatSetTypeKey, StatSet> = {} as Record<
    StatSetTypeKey,
    StatSet
  >;

  totalScore: number = 0;

  constructor(team: TeamData, prisma: PrismaClient) {
    this.team = team;
    this.prisma = prisma;
  }

  addStat(type: StatSetTypeKey, stat: Omit<StatSet, "type">): void {
    this.totalScore += stat.score;

    this.stats[type] = {
      type: type,
      raw: stat.raw,
      score: stat.score,
      description: stat.description,
      link: stat.link,
    };
  }

  async generateStats(): Promise<void> {
    await this.calculateFlagMinutes();
    await this.calculateFlagVisibilityViolations();
    await this.calculateConcurrentFlags();
    await this.calculateCapturedLifeTokens();
    await this.calculateMissingLifeTokens();
    await this.calculateRespawns();
    await this.calculateGameOfChanceStats();
    await this.calculateOtherActions();

    //endOfGame: {
    //   flagPossesion: number;
    //   lifeTokenPossesion: number;
    // };
    // teamWith: {
    //   mostConcurrentFlags: number;
    //   mostLifeTokensCaptured: number;
    //   mostLifeTokenslost: number;
    //   longestTimeWithFlag: number;
    //   longestTimeWithoutFlag: number;
    // };
  }

  async calculateFlagMinutes(): Promise<void> {
    const config = useRuntimeConfig();

    const flagTraces = await this.prisma.flag.findMany({
      where: {
        teamId: this.team.id,
        distance: {
          lte: config.public.flagCapturedDistance,
        },
      },
      orderBy: {
        datetime: "desc",
      },
    });

    // Calculate flag minutes.
    const flagMinutes = flagTraces.reduce(
      (acc, flagTrace) => acc + flagTrace.windowSize,
      0
    );
    const flagMinutesScore = flagTraces.reduce(
      (acc, flagTrace) =>
        acc +
        flagTrace.windowSize *
          flagTrace.scoreModifier *
          config.public.scoreModifiers.flagMinute,
      0
    );

    this.addStat("flagMinutes", {
      description: durationString(flagMinutes),
      raw: flagMinutes,
      score: flagMinutesScore,
      link: `/flags?teamId=${this.team.id}`,
    });

    // Calculate durations with and without flags.
    if (flagTraces.length <= 0) {
      this.addStat("longestTimeWithFlag", {
        description: "Never had a flag",
        raw: 0,
        score: 0,
        link: `/flags?teamId=${this.team.id}`,
      });
      this.addStat("longestTimeWithoutFlag", {
        description: "Never had a flag",
        raw: 0,
        score: 0,
        link: `/flags?teamId=${this.team.id}`,
      });
      return;
    }
    let prevFlagTime = DateTime.fromJSDate(
      flagTraces[flagTraces.length - 1].datetime
    );
    let flagCaptureStart = DateTime.fromJSDate(
      flagTraces[flagTraces.length - 1].datetime
    );
    let longestTimeWithFlag = 0;
    let longestTimeWithoutFlag = 0;

    for (const trace of flagTraces) {
      const traceDateTime = DateTime.fromJSDate(trace.datetime);

      const minutesSincePrevFlag = prevFlagTime.diff(
        traceDateTime,
        "minutes"
      ).minutes;

      if (trace.windowSize < minutesSincePrevFlag) {
        // More than the interval window is transpired.
        // The team did not have a flag between the previous time and this flag.
        longestTimeWithoutFlag = Math.max(
          longestTimeWithoutFlag,
          minutesSincePrevFlag
        );
        flagCaptureStart = traceDateTime;
        prevFlagTime = traceDateTime;
      } else {
        // Still within the interval window since previous flag.
        // The team did have a flag between the previous time and this flag.

        const minutesSinceCaptureStart = flagCaptureStart.diff(
          traceDateTime,
          "minutes"
        ).minutes;

        longestTimeWithFlag = Math.max(
          longestTimeWithFlag,
          minutesSinceCaptureStart
        );
        prevFlagTime = traceDateTime;
      }
    }

    this.addStat("longestTimeWithFlag", {
      description: durationString(longestTimeWithFlag),
      raw: longestTimeWithFlag,
      score: 0,
      link: `/flags?teamId=${this.team.id}`,
    });
    this.addStat("longestTimeWithoutFlag", {
      description: durationString(longestTimeWithoutFlag),
      raw: longestTimeWithoutFlag,
      score: 0,
      link: `/flags?teamId=${this.team.id}`,
    });
  }

  async calculateFlagVisibilityViolations(): Promise<void> {
    const config = useRuntimeConfig();

    // Calculate flag visibility violations.
    const flagVisibilityViolations = await this.prisma.action.aggregate({
      // _sum: { score: true },
      _count: { action: true },
      where: {
        teamId: this.team.id,
        action: "violationFlag",
      },
    });

    this.addStat("flagVisibilityViolations", {
      description: "times the flag got hidden",
      raw: flagVisibilityViolations._count.action,
      score:
        flagVisibilityViolations._count.action *
        config.public.scoreModifiers.flagVisibilityViolation,
      link: `/actions?teamId=${this.team.id}&action=violationFlag`,
    });
  }

  async calculateConcurrentFlags(): Promise<void> {
    const config = useRuntimeConfig();

    // Calculate concurrent flags.
    const concurrentFlagTraces = await this.prisma.flag.groupBy({
      by: "datetime",
      _count: { datetime: true },
      where: {
        teamId: this.team.id,
        distance: {
          lte: config.public.flagCapturedDistance,
        },
      },
      orderBy: {
        _count: {
          datetime: "desc",
        },
      },
      take: 1,
    });

    if (concurrentFlagTraces.length !== 1) {
      this.addStat("maxConcurrentFlags", {
        description: `No Flags Captured`,
        raw: 0,
        score: 0,
        link: `/flags?teamId=${this.team.id}`,
      });
      return;
    }

    this.addStat("maxConcurrentFlags", {
      description: `Occurred at ${concurrentFlagTraces[0].datetime}`,
      raw: concurrentFlagTraces[0]._count.datetime,
      score: 0, // Only awards points if the team with the most.
      link: `/flags?teamId=${this.team.id}`,
    });
  }

  async calculateCapturedLifeTokens(): Promise<void> {
    const config = useRuntimeConfig();

    // Calculate flag visibility violations.
    const capturedLifeTokens = await this.prisma.action.aggregate({
      _count: { action: true },
      _sum: { score: true },
      where: {
        teamId: this.team.id,
        action: "kill",
      },
    });

    this.addStat("capturedLifeTokens", {
      description: "kills",
      raw: capturedLifeTokens._count.action,
      score:
        (capturedLifeTokens._sum.score ?? 0) *
        config.public.scoreModifiers.capturedLifeToken,
      link: `/actions?teamId=${this.team.id}&action=kill`,
    });
  }

  async calculateMissingLifeTokens(): Promise<void> {
    const config = useRuntimeConfig();

    // Calculate flag visibility violations.
    const capturedLifeTokens = await this.prisma.action.aggregate({
      _count: { action: true },
      where: {
        teamId: this.team.id,
        action: "violationMissingLifeToken",
      },
    });

    this.addStat("missingLifeTokenViolations", {
      description: "times a player was missing a life token",
      raw: capturedLifeTokens._count.action,
      score:
        capturedLifeTokens._count.action *
        config.public.scoreModifiers.missingLifeToken,
      link: `/actions?teamId=${this.team.id}&action=violationMissingLifeToken`,
    });
  }

  async calculateRespawns(): Promise<void> {
    const config = useRuntimeConfig();

    // Calculate flag visibility violations.
    const respawns = await this.prisma.action.aggregate({
      _count: { action: true },
      _sum: { score: true },
      where: {
        teamId: this.team.id,
        action: "respawn",
      },
    });

    this.addStat("respawns", {
      description: "times respawned",
      raw: respawns._count.action,
      score: (respawns._sum.score ?? 0) * config.public.scoreModifiers.respawn,
      link: `/actions?teamId=${this.team.id}&action=respawn`,
    });
  }

  async calculateGameOfChanceStats(): Promise<void> {
    const config = useRuntimeConfig();

    const gameOfChanceWins = await this.prisma.action.aggregate({
      _count: { action: true },
      _sum: { score: true },
      where: {
        teamId: this.team.id,
        action: "chance",
        score: {
          gte: 0,
        },
      },
    });
    const gameOfChanceLoses = await this.prisma.action.aggregate({
      _count: { action: true },
      _sum: { score: true },
      where: {
        teamId: this.team.id,
        action: "chance",
        score: {
          lt: 0,
        },
      },
    });

    this.addStat("gameOfChanceWins", {
      description: "Games of Chance",
      raw: gameOfChanceWins._count.action,
      score:
        (gameOfChanceWins._sum.score ?? 0) *
        config.public.scoreModifiers.gameOfChanceWin,
      link: `/actions?teamId=${this.team.id}&action=chance`,
    });

    this.addStat("gameOfChanceLoses", {
      description: "Games of Chance",
      raw: gameOfChanceLoses._count.action,
      // both score and modifiers will be negative so we need to invert it again.
      score:
        (gameOfChanceLoses._sum.score ?? 0) *
        -1 *
        config.public.scoreModifiers.gameOfChanceLose,
      link: `/actions?teamId=${this.team.id}&action=chance`,
    });
  }

  async calculateOtherActions(): Promise<void> {
    const config = useRuntimeConfig();

    // Calculate flag visibility violations.
    const otherActions = await this.prisma.action.aggregate({
      _count: { action: true },
      _sum: { score: true },
      where: {
        teamId: this.team.id,
        action: "other",
      },
    });

    this.addStat("otherActions", {
      description: "kills",
      raw: otherActions._count.action,
      score:
        (otherActions._sum.score ?? 0) *
        config.public.scoreModifiers.otherActions,
      link: `/actions?teamId=${this.team.id}&action=other`,
    });
  }
}

function durationString(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${(minutes % 60).toFixed(0)}m`;
}
