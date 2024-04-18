import { Base, Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import prisma from "~/server/prisma";
import { BowAlertData } from "~/server/types/bowAlert";

interface ResponseSuccess {
  success: true;
  bowAlerts: BowAlertData[];
}
interface ResponseFailure {
  success: false;
  message: string;
}

interface QueryParams {
  faction: string;
}

export default defineEventHandler(
  async (event): Promise<ResponseSuccess | ResponseFailure> => {
    try {
      const params = getQuery<Partial<QueryParams>>(event);

      if (!params.faction) {
        return { success: false, message: `Missing faction param` };
      }

      const numberOfActiveAlerts = await prisma.bowAlert.count({
        where: {
          faction: {
            equals: params.faction,
          },
          expiry: {
            gt: new Date(Date.now()),
          },
        },
      });

      if (numberOfActiveAlerts <= 4) {
        await generateNewAlert(params.faction);
      }

      const bowAlerts = await prisma.bowAlert.findMany({
        where: {
          faction: {
            equals: params.faction,
          },
          expiry: {
            gt: new Date(Date.now()),
          },
        },
      });

      return {
        success: true,
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

const SECONDS = 1;
const MINUTES = SECONDS * 60;

const expiryChances = [
  ...new Array(1).fill(30 * SECONDS),
  ...new Array(2).fill(3 * MINUTES),
  ...new Array(5).fill(6 * MINUTES),
  ...new Array(5).fill(9 * MINUTES),
].flatMap((x): number => x);

async function generateNewAlert(faction: string) {
  const now = DateTime.now();

  const basesCount = await prisma.base.count();
  const skip = Math.floor(Math.random() * basesCount);
  const base = await prisma.base.findFirstOrThrow({
    take: 1,
    skip: skip,
  });

  const description = await generateDescription(base, faction);

  await prisma.bowAlert.create({
    data: {
      datetime: now.toISO() ?? "",
      description,
      expiry:
        now.plus({ seconds: arrayRandom(expiryChances).value }).toISO() ?? "",
      faction: faction,
      baseId: base.id,
    },
  });
}

async function generateDescription(
  base: Base,
  faction: string
): Promise<string> {
  const { value: rndDescription } = arrayRandom(alertDescriptions);

  const { value: rndName } = arrayRandom(alertShipNames[faction]);

  const description = rndDescription.title
    .replace("$planet", base.name)
    .replace("$ship", rndName);

  return description;
}

function arrayRandom<T>(arr: T[]): { value: T; index: number } {
  const index = Math.round(Math.random() * (arr.length - 1));
  return { value: arr[index], index };
}

const alertShipNames: Record<string, string[]> = {
  Federation: [
    "USS Enterprise",
    "USS Voyager",
    "USS Defiant",
    "USS Excelsior",
    "USS Titan",
    "USS Discovery",
    "USS Intrepid",
    "USS Sovereign",
    "USS Yorktown",
    "USS Enterprise-D",
  ],

  Borg: [
    "Borg Cube Prime",
    "Borg Sphere Alpha",
    "Borg Diamond Delta",
    "Borg Octahedron Sigma",
    "Borg Tetrahedron Omega",
    "Borg Assimilator Zeta",
    "Borg Transwarp Vessel Epsilon",
    "Borg Queen's Vessel Omicron",
    "Borg Regeneration Ship Theta",
    "Borg Interceptor Kappa",
  ],

  Romulan: [
    "IRW Warbird",
    "IRW Tomalak",
    "IRW Khazara",
    "IRW Valdore",
    "IRW Belak",
    "IRW Terix",
    "IRW Haakona",
    "IRW Praetor's Fury",
    "IRW Gal Gath'thong",
    "IRW Genorex",
  ],
};

const alertDescriptions = [
  {
    title: "$ship's systems are affected by Power failure",
    cause: "due to loss of power",
    action:
      "Team, initiate emergency power protocols, prioritize critical systems, and attempt to restore power. Search for damaged components and reroute power if necessary.",
  },
  {
    title: "$ship is encountering Communications breakdown",
    cause: "with inability to send or receive messages",
    action:
      "Team, troubleshoot communication systems, try alternative methods like signal amplifiers or relay stations, and coordinate with allies for assistance.",
  },
  {
    title: "$planet has issued a distress signal due to Environmental hazard",
    cause:
      "including dangerous weather, seismic activity, or atmospheric anomalies",
    action:
      "Team, monitor environmental systems, evacuate affected areas if necessary, and deploy protective measures like force fields or emergency shelters.",
  },
  {
    title: "$ship faces Structural damage",
    cause:
      "such as hull breaches, compromised integrity fields, or collapsing buildings",
    action:
      "Team, assess damage using tricorders or sensors, seal breaches with emergency patches, and reinforce compromised structures with support beams or force fields.",
  },
  {
    title: "$ship is running low on Resources",
    cause:
      "resulting in shortages of fuel, energy, or other essential supplies",
    action:
      "Team, ration remaining resources, prioritize essential functions like life support and propulsion, and explore nearby areas or vessels for potential sources of replenishment.",
  },
  {
    title: "$ship is experiencing Technological malfunction",
    cause:
      "due to malfunctioning equipment or systems leading to dangerous situations",
    action:
      "Team, diagnose the cause of the malfunction, attempt repairs using engineering tools and spare parts, and implement contingency plans to mitigate risks.",
  },
  {
    title: "$planet has declared an emergency due to Biological contamination",
    cause:
      "such as an outbreak of disease or infestation endangering inhabitants",
    action:
      "Team, isolate affected individuals or areas using quarantine protocols, administer medical treatment or antidotes, and implement decontamination procedures.",
  },
  {
    title: "$ship is experiencing Navigation error",
    cause: "resulting in getting lost in space or unable to find a safe route",
    action:
      "Team, review navigation logs and star charts, triangulate position using known reference points, and recalibrate navigational systems.",
  },
  {
    title: "$ship is dealing with Radiation exposure",
    cause:
      "due to dangerous levels of radiation posing a health risk to crew members or inhabitants",
    action:
      "Team, deploy radiation shielding materials, evacuate affected areas, and administer medical treatment like radiation blockers or anti-radiation medication.",
  },
  {
    title: "$planet has issued a distress signal due to Containment breach",
    cause:
      "resulting in the release of dangerous substances or creatures threatening safety",
    action:
      "Team, seal off affected areas, contain the breach by neutralizing or safely disposing of hazardous material or organisms, and implement decontamination protocols.",
  },
];
