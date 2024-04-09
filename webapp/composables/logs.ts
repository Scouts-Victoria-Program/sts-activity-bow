import type {
  LogData,
  LogCreateInput,
  LogUpdateInput,
} from "~/server/types/log";
import { usePageControls } from "./pageControls";

export const useLog = () => {
  const logsState = useState<Record<string, LogData>>("logs", () => ({}));

  return {
    logs: logsState,
    getLog(id: number): ComputedRef<LogData | null> {
      return computed(() => logsState.value[String(id)] ?? null);
    },
    setLog(log: LogData): void {
      logsState.value[String(log.id)] = log;
    },
    setLogs(logs: LogData[]): void {
      logs.forEach((log) => (logsState.value[String(log.id)] = log));
    },
    removeLog(logId: number): void {
      delete logsState.value[String(logId)];
    },
    useListLogs: (options: {
      where: {
        baseId?: Ref<number | undefined>;
        trackerId?: Ref<number | undefined>;
      };
    }) => {
      const { currentPage, useUiPageControls } = usePageControls();

      const { data, refresh, pending } = useFetch(`/api/logs`, {
        params: {
          page: currentPage,
          baseId: options.where.baseId,
          trackerId: options.where.trackerId,
        },
      });

      const uiPageControls = useUiPageControls(
        pending,
        refresh,
        computed(() => (data.value?.success ? data.value.maxPages : 0))
      );

      watch(data, (value) => {
        if (!value?.success) {
          return;
        }
        useLog().setLogs(value.logs);
      });

      return {
        displayLogs: computed(() => {
          if (!data.value?.success) {
            return [];
          }

          return data.value?.logs
            .map(({ id: logId }) => useLog().getLog(logId).value)
            .filter((log): log is LogData => log !== null);
        }),
        uiPageControls,
        refresh,
        loading: computed(() => pending.value),
        error: computed(
          () => pending.value === false && data.value?.success === false
        ),
        errorMessage: computed(() => {
          if (data.value?.success === false) {
            return data.value.message;
          }
          return "Unable to fetch log list";
        }),
      };
    },
    useListAllLogs: () => {
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      async function fetchLogPage(page: number = 1): Promise<number[]> {
        const { data } = await useFetch(`/api/logs`, {
          params: { page: page },
        });

        if (!data.value?.success) {
          error.value = true;
          errorMessage.value = data.value?.message;
          return [];
        }

        useLog().setLogs(data.value.logs);

        const logIds = data.value.logs.map((log) => log.id);

        if (data.value.maxPages <= page) {
          return logIds; // Log Ids from last page.
        }

        return [
          ...logIds, // Log Ids from current page.
          ...(await fetchLogPage(page + 1)), // Log Ids from future pages.
        ];
      }

      const pending = ref<boolean>(true);

      fetchLogPage()
        .then((logIdsFetched) => {
          const { logs, removeLog } = useLog();

          const logsIdsNotFetched = Object.values(logs)
            .filter((log) => !logIdsFetched.includes(log.id))
            .map((log) => log.id);

          logsIdsNotFetched.forEach((logId) => removeLog(logId));
        })
        .catch(() => {
          error.value = true;
          errorMessage.value = "Something went wrong";
        })
        .finally(() => {
          pending.value = false;
        });

      return {
        pending,
        error,
        errorMessage,
      };
    },
    useCreateLog: () => {
      const created = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async create(newLog: LogCreateInput): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/logs`, {
            method: "post",
            body: newLog,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useLog().setLog(data.log);

          // Set `created` ref so create button can be disabled
          // forever once we've had a successful creation.
          created.value = true;

          return data.log.id;
        },
        created,
        loading,
        error,
        errorMessage,
      };
    },
    useUpdateLog: () => {
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async update(updatedLog: LogUpdateInput): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/logs/${updatedLog.id}`, {
            method: "put",
            body: updatedLog,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useLog().setLog(data.log);

          return data.log.id;
        },
        loading,
        error,
        errorMessage,
      };
    },
    useDeleteLog: () => {
      const deleted = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async deleteFn(deleteLogId: number): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/logs/${deleteLogId}`, {
            method: "delete",
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useLog().removeLog(data.log.id);

          // Set `deleted` ref so delete button can be disabled
          // forever once we've had a successful creation.
          deleted.value = true;

          return data.log.id;
        },
        deleted,
        loading,
        error,
        errorMessage,
      };
    },
  };
};
