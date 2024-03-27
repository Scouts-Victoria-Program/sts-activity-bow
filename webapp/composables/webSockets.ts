import type {
  MessageDataAction,
  MessageDataFlag,
  MessageDataLog,
  MessageDataStatus,
  MessageDataTeam,
  MessageDataTracker,
} from "~/server/types/webSocket";
import { DateTime } from "luxon";

let socket: ReturnType<typeof useSocket> | null = null;

interface Entity {
  type: "action" | "flag" | "log" | "team" | "tracker";
  id: number;
}
export type WebSocketLog = {
  datetime: DateTime;
} & WebSocketLogInput;

interface WebSocketLogInput {
  entity?: Entity;
  related?: Entity[];
  message: string;
}

const logs = ref<WebSocketLog[]>([]);

const log = (message: WebSocketLogInput) => {
  if (logs.value.length > 30) {
    logs.value.splice(0, logs.value.length - 30);
  }

  logs.value.push({
    ...message,
    datetime: DateTime.now(),
  });
};

export const useWebSockets = () => {
  return {
    logs,
    initialise() {
      if (!process.client) {
        return;
      }

      socket = useSocket();

      // Connection opened
      socket.on("connect", () => {
        log({ message: "[connection]: connection successful" });
      });
      socket.on("disconnected", () => {
        log({ message: "[connection]: disconnected" });
      });

      // Listen for messages
      socket.on("status", handleStatus);
      socket.on("action", handleAction);
      socket.on("flag", handleFlag);
      socket.on("team", handleTeam);
      socket.on("tracker", handleTracker);
      socket.on("log", handleLog);
    },
    sendMessage(ev: string, message: string) {
      console.log(socket);
      console.log(message);

      socket?.emit(ev, message);
    },
  };
};

function handleStatus(data: MessageDataStatus) {
  log({ message: data.message });
}

function buildRelated(entity: {
  teamId?: number | null;
  trackerId?: number | null;
}): Entity[] {
  const related: Entity[] = [];
  if (entity.teamId) {
    related.push({ type: "team", id: entity.teamId });
  }
  if (entity.trackerId) {
    related.push({ type: "tracker", id: entity.trackerId });
  }

  return related;
}

function handleAction(data: MessageDataAction) {
  const { setAction, removeAction } = useAction();

  switch (data.action) {
    case "create":
      setAction(data.actionData);

      log({
        entity: { type: "action", id: data.actionData.id },
        related: buildRelated(data.actionData),
        message: "created",
      });
      break;
    case "update":
      setAction(data.actionData);
      log({
        entity: { type: "action", id: data.actionData.id },
        related: buildRelated(data.actionData),
        message: "updated",
      });
      break;
    case "delete":
      removeAction(data.actionId);
      log({
        entity: { type: "action", id: data.actionId },
        related: [],
        message: "deleted",
      });
      break;
  }
}
function handleFlag(data: MessageDataFlag) {
  const { setFlag, removeFlag } = useFlag();

  switch (data.action) {
    case "create":
      setFlag(data.flag);

      log({
        entity: { type: "flag", id: data.flag.id },
        related: buildRelated(data.flag),
        message: "created",
      });
      break;
    case "update":
      setFlag(data.flag);
      log({
        entity: { type: "flag", id: data.flag.id },
        related: buildRelated(data.flag),
        message: "updated",
      });
      break;
    case "delete":
      removeFlag(data.flagId);
      log({
        entity: { type: "flag", id: data.flagId },
        related: [],
        message: "deleted",
      });
      break;
  }
}

function handleTeam(data: MessageDataTeam) {
  const { setTeam, removeTeam } = useTeam();

  switch (data.action) {
    case "create":
      setTeam(data.team);
      log({
        entity: { type: "team", id: data.team.id },
        related: [],
        message: "created",
      });
      break;
    case "update":
      setTeam(data.team);
      log({
        entity: { type: "team", id: data.team.id },
        related: [],
        message: "updated",
      });
      break;
    case "delete":
      removeTeam(data.teamId);
      log({
        entity: { type: "team", id: data.teamId },
        related: [],
        message: "deleted",
      });
      break;
  }
}

function handleTracker(data: MessageDataTracker) {
  const { setTracker, removeTracker } = useTracker();

  switch (data.action) {
    case "create":
      setTracker(data.tracker);
      log({
        entity: { type: "tracker", id: data.tracker.id },
        related: [],
        message: "created",
      });
      break;
    case "update":
      setTracker(data.tracker);
      log({
        entity: { type: "tracker", id: data.tracker.id },
        related: [],
        message: "updated",
      });
      break;
    case "delete":
      removeTracker(data.trackerId);
      log({
        entity: { type: "tracker", id: data.trackerId },
        related: [],
        message: "deleted",
      });
      break;
  }
}

function handleLog(data: MessageDataLog) {
  const { setLog, removeLog } = useLog();

  switch (data.action) {
    case "create":
      setLog(data.log);
      log({
        entity: { type: "log", id: data.log.id },
        related: buildRelated(data.log),
        message: "created",
      });
      break;
    case "update":
      setLog(data.log);
      log({
        entity: { type: "log", id: data.log.id },
        related: buildRelated(data.log),
        message: "updated",
      });
      break;
    case "delete":
      removeLog(data.logId);
      log({
        entity: { type: "log", id: data.logId },
        related: [],
        message: "deleted",
      });
      break;
  }
}
