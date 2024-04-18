import type {
  BowAlertData,
  BowAlertCreateInput,
  BowAlertUpdateInput,
} from "~/server/types/bowAlert";
import { usePageControls } from "./pageControls";
import { DateTime, Duration } from "luxon";

interface FetchBowAlertComposable {
  bowAlert: ComputedRef<BowAlertData | null>;
  loading: Ref<boolean>;
}

// This is not good practice and you should never store state outside
// the composable constructor function. I havent been able to work out
// how to better define per entity composable fns.
const fetchBowAlertComposable: Record<string, FetchBowAlertComposable> = {};

export const useBowAlert = () => {
  const bowAlertsState = useState<Record<string, BowAlertData>>(
    "bowAlerts",
    () => ({})
  );

  return {
    bowAlerts: bowAlertsState,
    getBowAlert(id: number): ComputedRef<BowAlertData | null> {
      return computed(() => bowAlertsState.value[String(id)] ?? null);
    },
    setBowAlert(bowAlert: BowAlertData): void {
      bowAlertsState.value[String(bowAlert.id)] = bowAlert;
    },
    setBowAlerts(bowAlerts: BowAlertData[]): void {
      bowAlerts.forEach(
        (bowAlert) => (bowAlertsState.value[String(bowAlert.id)] = bowAlert)
      );
    },
    removeBowAlert(bowAlertId: number): void {
      delete bowAlertsState.value[String(bowAlertId)];
    },
    useFetchBowAlert: (bowAlertId: number | null): FetchBowAlertComposable => {
      if (bowAlertId === null) {
        return {
          bowAlert: computed(() => null),
          loading: ref(false),
        };
      }

      if (fetchBowAlertComposable[bowAlertId]) {
        return fetchBowAlertComposable[bowAlertId];
      }

      const { data, pending } = useFetch(
        `/api/games/bow/alerts/${bowAlertId}`,
        {}
      );

      fetchBowAlertComposable[bowAlertId] = {
        bowAlert: useBowAlert().getBowAlert(bowAlertId),
        loading: pending,
      };

      watch(data, (value) => {
        if (!value?.success) {
          return;
        }
        useBowAlert().setBowAlert(value.bowAlert);
      });

      return fetchBowAlertComposable[bowAlertId];
    },
    useListBowAlerts: () => {
      const { currentPage, useUiPageControls } = usePageControls();

      const { data, refresh, pending } = useFetch(`/api/games/bow/alerts`, {
        params: { page: currentPage },
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
        useBowAlert().setBowAlerts(value.bowAlerts);
      });

      return {
        displayBowAlerts: computed(() => {
          if (!data.value?.success) {
            return [];
          }

          return data.value?.bowAlerts
            .map(
              ({ id: bowAlertId }) =>
                useBowAlert().getBowAlert(bowAlertId).value
            )
            .filter((bowAlert): bowAlert is BowAlertData => bowAlert !== null);
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
          return "Unable to fetch bowAlert list";
        }),
      };
    },
    useListAllBowAlerts: () => {
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      async function fetchBowAlertPage(page: number = 1): Promise<number[]> {
        const { data } = await useFetch(`/api/games/bow/alerts`, {
          params: { page: page },
        });

        if (!data.value?.success) {
          error.value = true;
          errorMessage.value = data.value?.message;
          return [];
        }

        useBowAlert().setBowAlerts(data.value.bowAlerts);

        const bowAlertIds = data.value.bowAlerts.map((bowAlert) => bowAlert.id);

        if (data.value.maxPages <= page) {
          return bowAlertIds; // BowAlert Ids from last page.
        }

        return [
          ...bowAlertIds, // BowAlert Ids from current page.
          ...(await fetchBowAlertPage(page + 1)), // BowAlert Ids from future pages.
        ];
      }

      const pending = ref<boolean>(true);

      fetchBowAlertPage()
        .then((bowAlertIdsFetched) => {
          const { bowAlerts, removeBowAlert } = useBowAlert();

          const bowAlertsIdsNotFetched = Object.values(bowAlerts)
            .filter((bowAlert) => !bowAlertIdsFetched.includes(bowAlert.id))
            .map((bowAlert) => bowAlert.id);

          bowAlertsIdsNotFetched.forEach((bowAlertId) =>
            removeBowAlert(bowAlertId)
          );
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
    useCreateBowAlert: () => {
      const created = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async create(newBowAlert: BowAlertCreateInput): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/games/bow/alerts`, {
            method: "post",
            body: newBowAlert,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useBowAlert().setBowAlert(data.bowAlert);

          // Set `created` ref so create button can be disabled
          // forever once we've had a successful creation.
          created.value = true;

          return data.bowAlert.id;
        },
        created,
        loading,
        error,
        errorMessage,
      };
    },
    useUpdateBowAlert: () => {
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async update(
          updatedBowAlert: BowAlertUpdateInput
        ): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(
            `/api/games/bow/alerts/${updatedBowAlert.id}`,
            {
              method: "put",
              body: updatedBowAlert,
            }
          );

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useBowAlert().setBowAlert(data.bowAlert);

          return data.bowAlert.id;
        },
        loading,
        error,
        errorMessage,
      };
    },
    useDeleteBowAlert: () => {
      const deleted = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async deleteFn(deleteBowAlertId: number): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(
            `/api/games/bow/alerts/${deleteBowAlertId}`,
            {
              method: "delete",
            }
          );

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useBowAlert().removeBowAlert(data.bowAlert.id);

          // Set `deleted` ref so delete button can be disabled
          // forever once we've had a successful creation.
          deleted.value = true;

          return data.bowAlert.id;
        },
        deleted,
        loading,
        error,
        errorMessage,
      };
    },
    usePollBowAlerts: (faction: string) => {
      const { data, refresh, pending } = useFetch(
        `/api/games/bow/alerts/poll`,
        {
          params: { faction: faction },
        }
      );

      const lastFetchTime = ref<DateTime>(DateTime.now());
      const durationSinceLastFetch = ref<Duration>(
        Duration.fromObject({ seconds: 0 })
      );

      const expiredAlertIds = ref<number[]>([]);
      const alertExpiryDurationsById = ref<Record<string, Duration>>({});

      watch(data, (value) => {
        if (!value?.success) {
          return;
        }
        useBowAlert().setBowAlerts(value.bowAlerts);
        expiredAlertIds.value = [];
      });

      function intervalPollFn() {
        durationSinceLastFetch.value = lastFetchTime.value.diffNow();
        if (durationSinceLastFetch.value.negate().as("seconds") > 60 * 2) {
          lastFetchTime.value = DateTime.now();

          void refresh();
        }

        if (!data.value?.success) {
          return [];
        }

        for (const bowAlert of data.value?.bowAlerts) {
          const duration = DateTime.fromISO(bowAlert.expiry).diffNow();

          if (duration.milliseconds < 0) {
            expiredAlertIds.value.push(bowAlert.id);
          }

          alertExpiryDurationsById.value[String(bowAlert.id)] = duration;
        }
      }

      const intervalPoll = ref<NodeJS.Timeout | null>(null);
      function startPoller() {
        intervalPoll.value = setInterval(intervalPollFn, 100);
      }
      startPoller();

      return {
        poller: {
          durationSinceLastFetch,
          pause() {
            if (intervalPoll.value) {
              clearInterval(intervalPoll.value);
            }
          },
          resume() {
            startPoller();
          },
        },
        expiryControl: {
          getById(id: number): ComputedRef<Duration | undefined> {
            return computed(() => {
              return alertExpiryDurationsById.value[String(id)];
            });
          },
        },
        activeBowAlerts: computed(() => {
          if (!data.value?.success) {
            return [];
          }

          return data.value?.bowAlerts
            .map(
              ({ id: bowAlertId }) =>
                useBowAlert().getBowAlert(bowAlertId).value
            )
            .filter((bowAlert): bowAlert is BowAlertData => bowAlert !== null)
            .filter((bowAlert) => !expiredAlertIds.value.includes(bowAlert.id));
        }),
        refresh,
        loading: computed(() => pending.value),
        error: computed(
          () => pending.value === false && data.value?.success === false
        ),
        errorMessage: computed(() => {
          if (data.value?.success === false) {
            return data.value.message;
          }
          return "Unable to poll bowAlert list";
        }),
      };
    },
  };
};

function checkExpiration(duration: Duration) {
  if (duration.milliseconds < 0) {
    return expired;
  }
}
