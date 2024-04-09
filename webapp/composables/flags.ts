import type {
  TrackerLocationData,
  TrackerLocationCreateInput,
  TrackerLocationUpdateInput,
} from "~/server/types/trackerlocation";
import { usePageControls } from "./pageControls";
import { DateTime } from "luxon";

interface FetchTrackerLocationComposable {
  trackerlocation: ComputedRef<TrackerLocationData | null>;
  loading: Ref<boolean>;
}

// This is not good practice and you should never store state outside
// the composable constructor function. I havent been able to work out
// how to better define per entity composable fns.
const fetchTrackerLocationComposable: Record<
  string,
  FetchTrackerLocationComposable
> = {};

export const useTrackerLocation = () => {
  const trackerlocationsState = useState<Record<string, TrackerLocationData>>(
    "trackerlocations",
    () => ({})
  );

  return {
    trackerlocations: trackerlocationsState,
    getTrackerLocation(id: number): ComputedRef<TrackerLocationData | null> {
      return computed(() => trackerlocationsState.value[String(id)] ?? null);
    },
    setTrackerLocation(trackerlocation: TrackerLocationData): void {
      trackerlocationsState.value[String(trackerlocation.id)] = trackerlocation;
    },
    setTrackerLocations(trackerlocations: TrackerLocationData[]): void {
      trackerlocations.forEach(
        (trackerlocation) =>
          (trackerlocationsState.value[String(trackerlocation.id)] =
            trackerlocation)
      );
    },
    removeTrackerLocation(trackerlocationId: number): void {
      delete trackerlocationsState.value[String(trackerlocationId)];
    },
    useFetchTrackerLocation: (
      trackerlocationId: number | null
    ): FetchTrackerLocationComposable => {
      if (trackerlocationId === null) {
        return {
          trackerlocation: computed(() => null),
          loading: ref(false),
        };
      }

      if (fetchTrackerLocationComposable[trackerlocationId]) {
        return fetchTrackerLocationComposable[trackerlocationId];
      }

      const { data, pending } = useFetch(
        `/api/trackerlocations/${trackerlocationId}`,
        {}
      );

      fetchTrackerLocationComposable[trackerlocationId] = {
        trackerlocation:
          useTrackerLocation().getTrackerLocation(trackerlocationId),
        loading: pending,
      };

      watch(data, (value) => {
        if (!value?.success) {
          return;
        }
        useTrackerLocation().setTrackerLocation(value.trackerlocation);
      });

      return fetchTrackerLocationComposable[trackerlocationId];
    },
    useListTrackerLocations: (options: {
      where: {
        baseId?: Ref<number | undefined>;
        trackerId?: Ref<number | undefined>;
      };
    }) => {
      const { currentPage, useUiPageControls } = usePageControls();

      const { data, refresh, pending } = useFetch(`/api/trackerlocations`, {
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
        useTrackerLocation().setTrackerLocations(value.trackerlocations);
      });

      return {
        displayTrackerLocations: computed(() => {
          if (!data.value?.success) {
            return [];
          }

          return data.value?.trackerlocations
            .map(
              ({ id: trackerlocationId }) =>
                useTrackerLocation().getTrackerLocation(trackerlocationId).value
            )
            .filter(
              (trackerlocation): trackerlocation is TrackerLocationData =>
                trackerlocation !== null
            );
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
          return "Unable to fetch trackerlocation list";
        }),
      };
    },
    useListAllTrackerLocations: (maxAge: number = 1000) => {
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      async function fetchTrackerLocationPage(
        page: number = 1
      ): Promise<number[]> {
        const { data } = await useFetch(`/api/trackerlocations`, {
          params: { page: page },
        });

        if (!data.value?.success) {
          error.value = true;
          errorMessage.value = data.value?.message;
          return [];
        }

        useTrackerLocation().setTrackerLocations(data.value.trackerlocations);

        const trackerlocationIds = data.value.trackerlocations.map(
          (trackerlocation) => trackerlocation.id
        );

        if (data.value.maxPages <= page) {
          return trackerlocationIds; // TrackerLocation Ids from last page.
        }

        if (
          maxAge <
          DateTime.fromISO(data.value.trackerlocations[0].datetime)
            .diffNow("minutes")
            .negate().minutes
        ) {
          return trackerlocationIds; // Dont fetch further pages, they are too long ago.
        }

        return [
          ...trackerlocationIds, // TrackerLocation Ids from current page.
          ...(await fetchTrackerLocationPage(page + 1)), // TrackerLocation Ids from future pages.
        ];
      }

      const pending = ref<boolean>(true);

      fetchTrackerLocationPage()
        .then((trackerlocationIdsFetched) => {
          const { trackerlocations, removeTrackerLocation } =
            useTrackerLocation();

          const trackerlocationsIdsNotFetched = Object.values(trackerlocations)
            .filter(
              (trackerlocation) =>
                !trackerlocationIdsFetched.includes(trackerlocation.id)
            )
            .map((trackerlocation) => trackerlocation.id);

          trackerlocationsIdsNotFetched.forEach((trackerlocationId) =>
            removeTrackerLocation(trackerlocationId)
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
    useCreateTrackerLocation: () => {
      const created = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async create(
          newTrackerLocation: TrackerLocationCreateInput
        ): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/trackerlocations`, {
            method: "post",
            body: newTrackerLocation,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useTrackerLocation().setTrackerLocation(data.trackerlocation);

          // Set `created` ref so create button can be disabled
          // forever once we've had a successful creation.
          created.value = true;

          return data.trackerlocation.id;
        },
        created,
        loading,
        error,
        errorMessage,
      };
    },
    useUpdateTrackerLocation: () => {
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async update(
          updatedTrackerLocation: TrackerLocationUpdateInput
        ): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(
            `/api/trackerlocations/${updatedTrackerLocation.id}`,
            {
              method: "put",
              body: updatedTrackerLocation,
            }
          );

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useTrackerLocation().setTrackerLocation(data.trackerlocation);

          return data.trackerlocation.id;
        },
        loading,
        error,
        errorMessage,
      };
    },
    useDeleteTrackerLocation: () => {
      const deleted = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async deleteFn(
          deleteTrackerLocationId: number
        ): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(
            `/api/trackerlocations/${deleteTrackerLocationId}`,
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

          useTrackerLocation().removeTrackerLocation(data.trackerlocation.id);

          // Set `deleted` ref so delete button can be disabled
          // forever once we've had a successful creation.
          deleted.value = true;

          return data.trackerlocation.id;
        },
        deleted,
        loading,
        error,
        errorMessage,
      };
    },
  };
};
