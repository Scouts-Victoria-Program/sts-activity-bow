import type {
  FlagData,
  FlagCreateInput,
  FlagUpdateInput,
} from "~/server/types/flag";
import { usePageControls } from "./pageControls";
import { DateTime } from "luxon";

interface FetchFlagComposable {
  flag: ComputedRef<FlagData | null>;
  loading: Ref<boolean>;
}

// This is not good practice and you should never store state outside
// the composable constructor function. I havent been able to work out
// how to better define per entity composable fns.
const fetchFlagComposable: Record<string, FetchFlagComposable> = {};

export const useFlag = () => {
  const flagsState = useState<Record<string, FlagData>>("flags", () => ({}));

  return {
    flags: flagsState,
    getFlag(id: number): ComputedRef<FlagData | null> {
      return computed(() => flagsState.value[String(id)] ?? null);
    },
    setFlag(flag: FlagData): void {
      flagsState.value[String(flag.id)] = flag;
    },
    setFlags(flags: FlagData[]): void {
      flags.forEach((flag) => (flagsState.value[String(flag.id)] = flag));
    },
    removeFlag(flagId: number): void {
      delete flagsState.value[String(flagId)];
    },
    useFetchFlag: (flagId: number | null): FetchFlagComposable => {
      if (flagId === null) {
        return {
          flag: computed(() => null),
          loading: ref(false),
        };
      }

      if (fetchFlagComposable[flagId]) {
        return fetchFlagComposable[flagId];
      }

      const { data, pending } = useFetch(`/api/flags/${flagId}`, {});

      fetchFlagComposable[flagId] = {
        flag: useFlag().getFlag(flagId),
        loading: pending,
      };

      watch(data, (value) => {
        if (!value?.success) {
          return;
        }
        useFlag().setFlag(value.flag);
      });

      return fetchFlagComposable[flagId];
    },
    useListFlags: (options: {
      where: {
        teamId?: Ref<number | undefined>;
        trackerId?: Ref<number | undefined>;
      };
    }) => {
      const { currentPage, useUiPageControls } = usePageControls();

      const { data, refresh, pending } = useFetch(`/api/flags`, {
        params: {
          page: currentPage,
          teamId: options.where.teamId,
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
        useFlag().setFlags(value.flags);
      });

      return {
        displayFlags: computed(() => {
          if (!data.value?.success) {
            return [];
          }

          return data.value?.flags
            .map(({ id: flagId }) => useFlag().getFlag(flagId).value)
            .filter((flag): flag is FlagData => flag !== null);
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
          return "Unable to fetch flag list";
        }),
      };
    },
    useListAllFlags: (maxAge: number = 1000) => {
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      async function fetchFlagPage(page: number = 1): Promise<number[]> {
        const { data } = await useFetch(`/api/flags`, {
          params: { page: page },
        });

        if (!data.value?.success) {
          error.value = true;
          errorMessage.value = data.value?.message;
          return [];
        }

        useFlag().setFlags(data.value.flags);

        const flagIds = data.value.flags.map((flag) => flag.id);

        if (data.value.maxPages <= page) {
          return flagIds; // Flag Ids from last page.
        }

        if (
          maxAge <
          DateTime.fromISO(data.value.flags[0].datetime)
            .diffNow("minutes")
            .negate().minutes
        ) {
          return flagIds; // Dont fetch further pages, they are too long ago.
        }

        return [
          ...flagIds, // Flag Ids from current page.
          ...(await fetchFlagPage(page + 1)), // Flag Ids from future pages.
        ];
      }

      const pending = ref<boolean>(true);

      fetchFlagPage()
        .then((flagIdsFetched) => {
          const { flags, removeFlag } = useFlag();

          const flagsIdsNotFetched = Object.values(flags)
            .filter((flag) => !flagIdsFetched.includes(flag.id))
            .map((flag) => flag.id);

          flagsIdsNotFetched.forEach((flagId) => removeFlag(flagId));
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
    useCreateFlag: () => {
      const created = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async create(newFlag: FlagCreateInput): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/flags`, {
            method: "post",
            body: newFlag,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useFlag().setFlag(data.flag);

          // Set `created` ref so create button can be disabled
          // forever once we've had a successful creation.
          created.value = true;

          return data.flag.id;
        },
        created,
        loading,
        error,
        errorMessage,
      };
    },
    useUpdateFlag: () => {
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async update(updatedFlag: FlagUpdateInput): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/flags/${updatedFlag.id}`, {
            method: "put",
            body: updatedFlag,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useFlag().setFlag(data.flag);

          return data.flag.id;
        },
        loading,
        error,
        errorMessage,
      };
    },
    useDeleteFlag: () => {
      const deleted = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async deleteFn(deleteFlagId: number): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/flags/${deleteFlagId}`, {
            method: "delete",
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useFlag().removeFlag(data.flag.id);

          // Set `deleted` ref so delete button can be disabled
          // forever once we've had a successful creation.
          deleted.value = true;

          return data.flag.id;
        },
        deleted,
        loading,
        error,
        errorMessage,
      };
    },
  };
};
