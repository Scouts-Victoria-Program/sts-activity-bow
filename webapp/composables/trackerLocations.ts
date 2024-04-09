import type {
  TrackerLocationData,
  TrackerLocationCreateInput,
  TrackerLocationUpdateInput,
} from "~/server/types/trackerLocation";
import { usePageControls } from "./pageControls";
import { DateTime } from "luxon";

interface FetchTrackerLocationComposable {
  trackerLocation: ComputedRef<TrackerLocationData | null>;
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
  const trackerLocationsState = useState<Record<string, TrackerLocationData>>(
    "trackerLocations",
    () => ({})
  );

  return {
    trackerLocations: trackerLocationsState,
    getTrackerLocation(id: number): ComputedRef<TrackerLocationData | null> {
      return computed(() => trackerLocationsState.value[String(id)] ?? null);
    },
    setTrackerLocation(trackerLocation: TrackerLocationData): void {
      trackerLocationsState.value[String(trackerLocation.id)] = trackerLocation;
    },
    setTrackerLocations(trackerLocations: TrackerLocationData[]): void {
      trackerLocations.forEach(
        (trackerLocation) =>
          (trackerLocationsState.value[String(trackerLocation.id)] =
            trackerLocation)
      );
    },
    removeTrackerLocation(trackerLocationId: number): void {
      delete trackerLocationsState.value[String(trackerLocationId)];
    },
    useFetchTrackerLocation: (
      trackerLocationId: number | null
    ): FetchTrackerLocationComposable => {
      if (trackerLocationId === null) {
        return {
          trackerLocation: computed(() => null),
          loading: ref(false),
        };
      }

      if (fetchTrackerLocationComposable[trackerLocationId]) {
        return fetchTrackerLocationComposable[trackerLocationId];
      }

      const { data, pending } = useFetch(
        `/api/locations/${trackerLocationId}`,
        {}
      );

      fetchTrackerLocationComposable[trackerLocationId] = {
        trackerLocation:
          useTrackerLocation().getTrackerLocation(trackerLocationId),
        loading: pending,
      };

      watch(data, (value) => {
        if (!value?.success) {
          return;
        }
        useTrackerLocation().setTrackerLocation(value.trackerLocation);
      });

      return fetchTrackerLocationComposable[trackerLocationId];
    },
    useListTrackerLocations: (options: {
      where: {
        baseId?: Ref<number | undefined>;
        trackerId?: Ref<number | undefined>;
      };
    }) => {
      const { currentPage, useUiPageControls } = usePageControls();

      const { data, refresh, pending } = useFetch(`/api/locations`, {
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
        useTrackerLocation().setTrackerLocations(value.trackerLocations);
      });

      return {
        displayTrackerLocations: computed(() => {
          if (!data.value?.success) {
            return [];
          }

          return data.value?.trackerLocations
            .map(
              ({ id: trackerLocationId }) =>
                useTrackerLocation().getTrackerLocation(trackerLocationId).value
            )
            .filter(
              (trackerLocation): trackerLocation is TrackerLocationData =>
                trackerLocation !== null
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
          return "Unable to fetch trackerLocation list";
        }),
      };
    },
    useListAllTrackerLocations: (maxAge: number = 1000) => {
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      async function fetchTrackerLocationPage(
        page: number = 1
      ): Promise<number[]> {
        const { data } = await useFetch(`/api/locations`, {
          params: { page: page },
        });

        if (!data.value?.success) {
          error.value = true;
          errorMessage.value = data.value?.message;
          return [];
        }

        useTrackerLocation().setTrackerLocations(data.value.trackerLocations);

        const trackerLocationIds = data.value.trackerLocations.map(
          (trackerLocation) => trackerLocation.id
        );

        if (data.value.maxPages <= page) {
          return trackerLocationIds; // TrackerLocation Ids from last page.
        }

        if (
          maxAge <
          DateTime.fromISO(data.value.trackerLocations[0].datetime)
            .diffNow("minutes")
            .negate().minutes
        ) {
          return trackerLocationIds; // Dont fetch further pages, they are too long ago.
        }

        return [
          ...trackerLocationIds, // TrackerLocation Ids from current page.
          ...(await fetchTrackerLocationPage(page + 1)), // TrackerLocation Ids from future pages.
        ];
      }

      const pending = ref<boolean>(true);

      fetchTrackerLocationPage()
        .then((trackerLocationIdsFetched) => {
          const { trackerLocations, removeTrackerLocation } =
            useTrackerLocation();

          const trackerLocationsIdsNotFetched = Object.values(trackerLocations)
            .filter(
              (trackerLocation) =>
                !trackerLocationIdsFetched.includes(trackerLocation.id)
            )
            .map((trackerLocation) => trackerLocation.id);

          trackerLocationsIdsNotFetched.forEach((trackerLocationId) =>
            removeTrackerLocation(trackerLocationId)
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
          const data = await $fetch(`/api/locations`, {
            method: "post",
            body: newTrackerLocation,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useTrackerLocation().setTrackerLocation(data.trackerLocation);

          // Set `created` ref so create button can be disabled
          // forever once we've had a successful creation.
          created.value = true;

          return data.trackerLocation.id;
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
            `/api/locations/${updatedTrackerLocation.id}`,
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

          useTrackerLocation().setTrackerLocation(data.trackerLocation);

          return data.trackerLocation.id;
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
            `/api/locations/${deleteTrackerLocationId}`,
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

          useTrackerLocation().removeTrackerLocation(data.trackerLocation.id);

          // Set `deleted` ref so delete button can be disabled
          // forever once we've had a successful creation.
          deleted.value = true;

          return data.trackerLocation.id;
        },
        deleted,
        loading,
        error,
        errorMessage,
      };
    },
  };
};
