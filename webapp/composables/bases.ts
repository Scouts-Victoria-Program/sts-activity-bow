import type {
  BaseData,
  BaseCreateInput,
  BaseUpdateInput,
} from "~/server/types/base";
import { usePageControls } from "./pageControls";

interface FetchBaseComposable {
  base: ComputedRef<BaseData | null>;
  loading: Ref<boolean>;
}

// This is not good practice and you should never store state outside
// the composable constructor function. I havent been able to work out
// how to better define per entity composable fns.
const fetchBaseComposable: Record<string, FetchBaseComposable> = {};

export const useBase = () => {
  const basesState = useState<Record<string, BaseData>>("bases", () => ({}));

  return {
    bases: basesState,
    getBase(id: number): ComputedRef<BaseData | null> {
      return computed(() => basesState.value[String(id)] ?? null);
    },
    setBase(base: BaseData): void {
      basesState.value[String(base.id)] = base;
    },
    setBases(bases: BaseData[]): void {
      bases.forEach((base) => (basesState.value[String(base.id)] = base));
    },
    removeBase(baseId: number): void {
      delete basesState.value[String(baseId)];
    },
    useFetchBase: (baseId: number | null): FetchBaseComposable => {
      if (baseId === null) {
        return {
          base: computed(() => null),
          loading: ref(false),
        };
      }

      if (fetchBaseComposable[baseId]) {
        return fetchBaseComposable[baseId];
      }

      const { data, pending } = useFetch(`/api/bases/${baseId}`, {});

      fetchBaseComposable[baseId] = {
        base: useBase().getBase(baseId),
        loading: pending,
      };

      watch(data, (value) => {
        if (!value?.success) {
          return;
        }
        useBase().setBase(value.base);
      });

      return fetchBaseComposable[baseId];
    },
    useListBases: () => {
      const { currentPage, useUiPageControls } = usePageControls();

      const { data, refresh, pending } = useFetch(`/api/bases`, {
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
        useBase().setBases(value.bases);
      });

      return {
        displayBases: computed(() => {
          if (!data.value?.success) {
            return [];
          }

          return data.value?.bases
            .map(({ id: baseId }) => useBase().getBase(baseId).value)
            .filter((base): base is BaseData => base !== null);
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
          return "Unable to fetch base list";
        }),
      };
    },
    useListAllBases: () => {
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      async function fetchBasePage(page: number = 1): Promise<number[]> {
        const { data } = await useFetch(`/api/bases`, {
          params: { page: page },
        });

        if (!data.value?.success) {
          error.value = true;
          errorMessage.value = data.value?.message;
          return [];
        }

        useBase().setBases(data.value.bases);

        const baseIds = data.value.bases.map((base) => base.id);

        if (data.value.maxPages <= page) {
          return baseIds; // Base Ids from last page.
        }

        return [
          ...baseIds, // Base Ids from current page.
          ...(await fetchBasePage(page + 1)), // Base Ids from future pages.
        ];
      }

      const pending = ref<boolean>(true);

      fetchBasePage()
        .then((baseIdsFetched) => {
          const { bases, removeBase } = useBase();

          const basesIdsNotFetched = Object.values(bases)
            .filter((base) => !baseIdsFetched.includes(base.id))
            .map((base) => base.id);

          basesIdsNotFetched.forEach((baseId) => removeBase(baseId));
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
    useCreateBase: () => {
      const created = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async create(newBase: BaseCreateInput): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/bases`, {
            method: "post",
            body: newBase,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useBase().setBase(data.base);

          // Set `created` ref so create button can be disabled
          // forever once we've had a successful creation.
          created.value = true;

          return data.base.id;
        },
        created,
        loading,
        error,
        errorMessage,
      };
    },
    useUpdateBase: () => {
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async update(updatedBase: BaseUpdateInput): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/bases/${updatedBase.id}`, {
            method: "put",
            body: updatedBase,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useBase().setBase(data.base);

          return data.base.id;
        },
        loading,
        error,
        errorMessage,
      };
    },
    useDeleteBase: () => {
      const deleted = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async deleteFn(deleteBaseId: number): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/bases/${deleteBaseId}`, {
            method: "delete",
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useBase().removeBase(data.base.id);

          // Set `deleted` ref so delete button can be disabled
          // forever once we've had a successful creation.
          deleted.value = true;

          return data.base.id;
        },
        deleted,
        loading,
        error,
        errorMessage,
      };
    },
  };
};
