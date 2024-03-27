import type {
  TrackerData,
  TrackerCreateInput,
  TrackerUpdateInput,
} from "~/server/types/tracker";
import { usePageControls } from "./pageControls";

interface FetchTrackerComposable {
  tracker: ComputedRef<TrackerData | null>;
  loading: Ref<boolean>;
}

// This is not good practice and you should never store state outside
// the composable constructor function. I havent been able to work out
// how to better define per entity composable fns.
const fetchTrackerComposable: Record<string, FetchTrackerComposable> = {};

export const useTracker = () => {
  const trackersState = useState<Record<string, TrackerData>>(
    "trackers",
    () => ({})
  );

  return {
    trackers: trackersState,
    getTracker(id: number): ComputedRef<TrackerData | null> {
      return computed(() => trackersState.value[String(id)] ?? null);
    },
    setTracker(tracker: TrackerData): void {
      trackersState.value[String(tracker.id)] = tracker;
    },
    setTrackers(trackers: TrackerData[]): void {
      trackers.forEach(
        (tracker) => (trackersState.value[String(tracker.id)] = tracker)
      );
    },
    removeTracker(trackerId: number): void {
      delete trackersState.value[String(trackerId)];
    },
    useFetchTracker: (trackerId: number | null): FetchTrackerComposable => {
      if (trackerId === null) {
        return {
          tracker: computed(() => null),
          loading: ref(false),
        };
      }

      if (fetchTrackerComposable[trackerId]) {
        return fetchTrackerComposable[trackerId];
      }

      const { data, pending } = useFetch(`/api/trackers/${trackerId}`, {});
      watch(data, (value) => {
        if (!value?.success) {
          return;
        }
        useTracker().setTracker(value.tracker);
      });

      fetchTrackerComposable[trackerId] = {
        tracker: useTracker().getTracker(trackerId),
        loading: pending,
      };

      return fetchTrackerComposable[trackerId];
    },
    useListTrackers: () => {
      const { currentPage, useUiPageControls } = usePageControls();

      const { data, refresh, pending } = useFetch(`/api/trackers`, {
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
        useTracker().setTrackers(value.trackers);
      });

      return {
        displayTrackers: computed(() => {
          if (!data.value?.success) {
            return [];
          }

          return data.value?.trackers
            .map(
              ({ id: trackerId }) => useTracker().getTracker(trackerId).value
            )
            .filter((tracker): tracker is TrackerData => tracker !== null);
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
          return "Unable to fetch tracker list";
        }),
      };
    },
    useListAllTrackers: () => {
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      async function fetchTrackerPage(page: number = 1): Promise<number[]> {
        const { data } = await useFetch(`/api/trackers`, {
          params: { page: page },
        });

        if (!data.value?.success) {
          error.value = true;
          errorMessage.value = data.value?.message;
          return [];
        }

        useTracker().setTrackers(data.value.trackers);

        const trackerIds = data.value.trackers.map((tracker) => tracker.id);

        if (data.value.maxPages <= page) {
          return trackerIds; // Tracker Ids from last page.
        }

        return [
          ...trackerIds, // Tracker Ids from current page.
          ...(await fetchTrackerPage(page + 1)), // Tracker Ids from future pages.
        ];
      }

      const pending = ref<boolean>(true);

      fetchTrackerPage()
        .then((trackerIdsFetched) => {
          const { trackers, removeTracker } = useTracker();

          const trackersIdsNotFetched = Object.values(trackers)
            .filter((tracker) => !trackerIdsFetched.includes(tracker.id))
            .map((tracker) => tracker.id);

          trackersIdsNotFetched.forEach((trackerId) =>
            removeTracker(trackerId)
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
    useCreateTracker: () => {
      const created = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async create(newTracker: TrackerCreateInput): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/trackers`, {
            method: "post",
            body: newTracker,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useTracker().setTracker(data.tracker);

          // Set `created` ref so create button can be disabled
          // forever once we've had a successful creation.
          created.value = true;

          return data.tracker.id;
        },
        created,
        loading,
        error,
        errorMessage,
      };
    },
    useUpdateTracker: () => {
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async update(
          updatedTracker: TrackerUpdateInput
        ): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/trackers/${updatedTracker.id}`, {
            method: "put",
            body: updatedTracker,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useTracker().setTracker(data.tracker);

          return data.tracker.id;
        },
        loading,
        error,
        errorMessage,
      };
    },
    useDeleteTracker: () => {
      const deleted = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async deleteFn(deleteTrackerId: number): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/trackers/${deleteTrackerId}`, {
            method: "delete",
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useTracker().removeTracker(data.tracker.id);

          // Set `deleted` ref so delete button can be disabled
          // forever once we've had a successful creation.
          deleted.value = true;

          return data.tracker.id;
        },
        deleted,
        loading,
        error,
        errorMessage,
      };
    },
  };
};
