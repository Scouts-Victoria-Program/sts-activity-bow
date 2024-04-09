import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "~/server/prisma";
import {
  StatSet,
  StatData,
  StatSetType,
  StatSetTypeKey,
} from "~/server/types/stat";
import { BaseData } from "~/server/types/base";
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
  bases: BaseData[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  static async Builder(prisma: PrismaClient) {
    const statBuilder = new StatBuilder(prisma);

    await statBuilder.loadBases();

    await statBuilder.generateStats();

    return statBuilder;
  }

  async loadBases(): Promise<void> {
    const bases = await this.prisma.base.findMany({
      orderBy: {
        id: "asc",
      },
    });

    this.bases = bases.map((base) => {
      const baseData: BaseData = {
        id: base.id,
        name: base.name,
        lat: base.lat,
        long: base.long,
      };
      return baseData;
    });
  }

  async generateStats() {
    const baseStats: StatData["bases"] = [];

    for (const base of this.bases) {
      const baseStatManager = new BaseStatManager(base, this.prisma);
      await baseStatManager.generateStats();
      baseStats.push({
        id: base.id,
        stats: baseStatManager.stats,
        score: baseStatManager.totalScore,
      });
    }

    this.stats = {
      statTypes: StatSetType,
      bases: baseStats,
    };
  }
}

class BaseStatManager {
  base: BaseData;
  prisma: PrismaClient;

  stats: Record<StatSetTypeKey, StatSet> = {} as Record<
    StatSetTypeKey,
    StatSet
  >;

  totalScore: number = 0;

  constructor(base: BaseData, prisma: PrismaClient) {
    this.base = base;
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
    await this.calculateTrackerLocationMinutes();
    await this.calculateTrackerLocationVisibilityViolations();
    await this.calculateConcurrentTrackerLocations();
    await this.calculateCapturedLifeTokens();
    await this.calculateMissingLifeTokens();
    await this.calculateRespawns();
    await this.calculateGameOfChanceStats();
    await this.calculateOtherActions();

    //endOfGame: {
    //   trackerLocationPossesion: number;
    //   lifeTokenPossesion: number;
    // };
    // baseWith: {
    //   mostConcurrentTrackerLocations: number;
    //   mostLifeTokensCaptured: number;
    //   mostLifeTokenslost: number;
    //   longestTimeWithTrackerLocation: number;
    //   longestTimeWithoutTrackerLocation: number;
    // };
  }

  async calculateTrackerLocationMinutes(): Promise<void> {
    const config = useRuntimeConfig();

    const trackerLocationTraces = await this.prisma.trackerLocation.findMany({
      where: {
        baseId: this.base.id,
        distance: {
          lte: config.public.trackerLocationCapturedDistance,
        },
      },
      orderBy: {
        datetime: "desc",
      },
    });

    // Calculate trackerLocation minutes.
    const trackerLocationMinutes = trackerLocationTraces.reduce(
      (acc, trackerLocationTrace) => acc + trackerLocationTrace.windowSize,
      0
    );
    const trackerLocationMinutesScore = trackerLocationTraces.reduce(
      (acc, trackerLocationTrace) =>
        acc +
        trackerLocationTrace.windowSize *
          trackerLocationTrace.scoreModifier *
          config.public.scoreModifiers.trackerLocationMinute,
      0
    );

    this.addStat("trackerLocationMinutes", {
      description: durationString(trackerLocationMinutes),
      raw: trackerLocationMinutes,
      score: trackerLocationMinutesScore,
      link: `/locations?baseId=${this.base.id}`,
    });

    // Calculate durations with and without trackerLocations.
    if (trackerLocationTraces.length <= 0) {
      this.addStat("longestTimeWithTrackerLocation", {
        description: "Never had a trackerLocation",
        raw: 0,
        score: 0,
        link: `/locations?baseId=${this.base.id}`,
      });
      this.addStat("longestTimeWithoutTrackerLocation", {
        description: "Never had a trackerLocation",
        raw: 0,
        score: 0,
        link: `/locations?baseId=${this.base.id}`,
      });
      return;
    }
    let prevTrackerLocationTime = DateTime.fromJSDate(
      trackerLocationTraces[trackerLocationTraces.length - 1].datetime
    );
    let trackerLocationCaptureStart = DateTime.fromJSDate(
      trackerLocationTraces[trackerLocationTraces.length - 1].datetime
    );
    let longestTimeWithTrackerLocation = 0;
    let longestTimeWithoutTrackerLocation = 0;

    for (const trace of trackerLocationTraces) {
      const traceDateTime = DateTime.fromJSDate(trace.datetime);

      const minutesSincePrevTrackerLocation = prevTrackerLocationTime.diff(
        traceDateTime,
        "minutes"
      ).minutes;

      if (trace.windowSize < minutesSincePrevTrackerLocation) {
        // More than the interval window is transpired.
        // The base did not have a trackerLocation between the previous time and this trackerLocation.
        longestTimeWithoutTrackerLocation = Math.max(
          longestTimeWithoutTrackerLocation,
          minutesSincePrevTrackerLocation
        );
        trackerLocationCaptureStart = traceDateTime;
        prevTrackerLocationTime = traceDateTime;
      } else {
        // Still within the interval window since previous trackerLocation.
        // The base did have a trackerLocation between the previous time and this trackerLocation.

        const minutesSinceCaptureStart = trackerLocationCaptureStart.diff(
          traceDateTime,
          "minutes"
        ).minutes;

        longestTimeWithTrackerLocation = Math.max(
          longestTimeWithTrackerLocation,
          minutesSinceCaptureStart
        );
        prevTrackerLocationTime = traceDateTime;
      }
    }

    this.addStat("longestTimeWithTrackerLocation", {
      description: durationString(longestTimeWithTrackerLocation),
      raw: longestTimeWithTrackerLocation,
      score: 0,
      link: `/locations?baseId=${this.base.id}`,
    });
    this.addStat("longestTimeWithoutTrackerLocation", {
      description: durationString(longestTimeWithoutTrackerLocation),
      raw: longestTimeWithoutTrackerLocation,
      score: 0,
      link: `/locations?baseId=${this.base.id}`,
    });
  }

  async calculateTrackerLocationVisibilityViolations(): Promise<void> {
    const config = useRuntimeConfig();

    // Calculate trackerLocation visibility violations.
    const trackerLocationVisibilityViolations =
      await this.prisma.action.aggregate({
        // _sum: { score: true },
        _count: { action: true },
        where: {
          baseId: this.base.id,
          action: "violationTrackerLocation",
        },
      });

    this.addStat("trackerLocationVisibilityViolations", {
      description: "times the trackerLocation got hidden",
      raw: trackerLocationVisibilityViolations._count.action,
      score:
        trackerLocationVisibilityViolations._count.action *
        config.public.scoreModifiers.trackerLocationVisibilityViolation,
      link: `/actions?baseId=${this.base.id}&action=violationTrackerLocation`,
    });
  }

  async calculateConcurrentTrackerLocations(): Promise<void> {
    const config = useRuntimeConfig();

    // Calculate concurrent trackerLocations.
    const concurrentTrackerLocationTraces =
      await this.prisma.trackerLocation.groupBy({
        by: "datetime",
        _count: { datetime: true },
        where: {
          baseId: this.base.id,
          distance: {
            lte: config.public.trackerLocationCapturedDistance,
          },
        },
        orderBy: {
          _count: {
            datetime: "desc",
          },
        },
        take: 1,
      });

    if (concurrentTrackerLocationTraces.length !== 1) {
      this.addStat("maxConcurrentTrackerLocations", {
        description: `No TrackerLocations Captured`,
        raw: 0,
        score: 0,
        link: `/locations?baseId=${this.base.id}`,
      });
      return;
    }

    this.addStat("maxConcurrentTrackerLocations", {
      description: `Occurred at ${concurrentTrackerLocationTraces[0].datetime}`,
      raw: concurrentTrackerLocationTraces[0]._count.datetime,
      score: 0, // Only awards points if the base with the most.
      link: `/locations?baseId=${this.base.id}`,
    });
  }

  async calculateCapturedLifeTokens(): Promise<void> {
    const config = useRuntimeConfig();

    // Calculate trackerLocation visibility violations.
    const capturedLifeTokens = await this.prisma.action.aggregate({
      _count: { action: true },
      _sum: { score: true },
      where: {
        baseId: this.base.id,
        action: "kill",
      },
    });

    this.addStat("capturedLifeTokens", {
      description: "kills",
      raw: capturedLifeTokens._count.action,
      score:
        (capturedLifeTokens._sum.score ?? 0) *
        config.public.scoreModifiers.capturedLifeToken,
      link: `/actions?baseId=${this.base.id}&action=kill`,
    });
  }

  async calculateMissingLifeTokens(): Promise<void> {
    const config = useRuntimeConfig();

    // Calculate trackerLocation visibility violations.
    const capturedLifeTokens = await this.prisma.action.aggregate({
      _count: { action: true },
      where: {
        baseId: this.base.id,
        action: "violationMissingLifeToken",
      },
    });

    this.addStat("missingLifeTokenViolations", {
      description: "times a player was missing a life token",
      raw: capturedLifeTokens._count.action,
      score:
        capturedLifeTokens._count.action *
        config.public.scoreModifiers.missingLifeToken,
      link: `/actions?baseId=${this.base.id}&action=violationMissingLifeToken`,
    });
  }

  async calculateRespawns(): Promise<void> {
    const config = useRuntimeConfig();

    // Calculate trackerLocation visibility violations.
    const respawns = await this.prisma.action.aggregate({
      _count: { action: true },
      _sum: { score: true },
      where: {
        baseId: this.base.id,
        action: "respawn",
      },
    });

    this.addStat("respawns", {
      description: "times respawned",
      raw: respawns._count.action,
      score: (respawns._sum.score ?? 0) * config.public.scoreModifiers.respawn,
      link: `/actions?baseId=${this.base.id}&action=respawn`,
    });
  }

  async calculateGameOfChanceStats(): Promise<void> {
    const config = useRuntimeConfig();

    const gameOfChanceWins = await this.prisma.action.aggregate({
      _count: { action: true },
      _sum: { score: true },
      where: {
        baseId: this.base.id,
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
        baseId: this.base.id,
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
      link: `/actions?baseId=${this.base.id}&action=chance`,
    });

    this.addStat("gameOfChanceLoses", {
      description: "Games of Chance",
      raw: gameOfChanceLoses._count.action,
      // both score and modifiers will be negative so we need to invert it again.
      score:
        (gameOfChanceLoses._sum.score ?? 0) *
        -1 *
        config.public.scoreModifiers.gameOfChanceLose,
      link: `/actions?baseId=${this.base.id}&action=chance`,
    });
  }

  async calculateOtherActions(): Promise<void> {
    const config = useRuntimeConfig();

    // Calculate trackerLocation visibility violations.
    const otherActions = await this.prisma.action.aggregate({
      _count: { action: true },
      _sum: { score: true },
      where: {
        baseId: this.base.id,
        action: "other",
      },
    });

    this.addStat("otherActions", {
      description: "kills",
      raw: otherActions._count.action,
      score:
        (otherActions._sum.score ?? 0) *
        config.public.scoreModifiers.otherActions,
      link: `/actions?baseId=${this.base.id}&action=other`,
    });
  }
}

function durationString(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${(minutes % 60).toFixed(0)}m`;
}
