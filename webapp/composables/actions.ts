import type {
  ActionData,
  ActionCreateInput,
  ActionUpdateInput,
  ActionOptionKeys,
} from "~/server/types/action";
import { usePageControls } from "./pageControls";

interface FetchActionComposable {
  action: ComputedRef<ActionData | null>;
  loading: Ref<boolean>;
}

// This is not good practice and you should never store state outside
// the composable constructor function. I havent been able to work out
// how to better define per entity composable fns.
const fetchActionComposable: Record<string, FetchActionComposable> = {};

export const useAction = () => {
  const actionsState = useState<Record<string, ActionData>>(
    "actions",
    () => ({})
  );

  return {
    actions: actionsState,
    getAction(id: number): ComputedRef<ActionData | null> {
      return computed(() => actionsState.value[String(id)] ?? null);
    },
    setAction(action: ActionData): void {
      actionsState.value[String(action.id)] = action;
    },
    setActions(actions: ActionData[]): void {
      actions.forEach(
        (action) => (actionsState.value[String(action.id)] = action)
      );
    },
    removeAction(actionId: number): void {
      delete actionsState.value[String(actionId)];
    },
    useFetchAction: (actionId: number | null): FetchActionComposable => {
      if (actionId === null) {
        return {
          action: computed(() => null),
          loading: ref(false),
        };
      }

      if (fetchActionComposable[actionId]) {
        return fetchActionComposable[actionId];
      }

      const { data, pending } = useFetch(`/api/actions/${actionId}`, {});

      fetchActionComposable[actionId] = {
        action: useAction().getAction(actionId),
        loading: pending,
      };

      watch(data, (value) => {
        if (!value?.success) {
          return;
        }
        useAction().setAction(value.action);
      });

      return fetchActionComposable[actionId];
    },
    useListActions: (options: {
      where: {
        teamId?: Ref<number | undefined>;
        action?: Ref<ActionOptionKeys | undefined>;
      };
    }) => {
      const { currentPage, useUiPageControls } = usePageControls();

      const { data, refresh, pending } = useFetch(`/api/actions`, {
        params: {
          page: currentPage,
          teamId: options.where.teamId,
          action: options.where.action,
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
        useAction().setActions(value.actions);
      });

      return {
        displayActions: computed(() => {
          if (!data.value?.success) {
            return [];
          }

          return data.value?.actions
            .map(({ id: actionId }) => useAction().getAction(actionId).value)
            .filter((action): action is ActionData => action !== null);
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
          return "Unable to fetch action list";
        }),
      };
    },
    useListAllActions: () => {
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      async function fetchActionPage(page: number = 1): Promise<number[]> {
        const { data } = await useFetch(`/api/actions`, {
          params: { page: page },
        });

        if (!data.value?.success) {
          error.value = true;
          errorMessage.value = data.value?.message;
          return [];
        }

        useAction().setActions(data.value.actions);

        const actionIds = data.value.actions.map((action) => action.id);

        if (data.value.maxPages <= page) {
          return actionIds; // Action Ids from last page.
        }

        return [
          ...actionIds, // Action Ids from current page.
          ...(await fetchActionPage(page + 1)), // Action Ids from future pages.
        ];
      }

      const pending = ref<boolean>(true);

      fetchActionPage()
        .then((actionIdsFetched) => {
          const { actions, removeAction } = useAction();

          const actionsIdsNotFetched = Object.values(actions)
            .filter((action) => !actionIdsFetched.includes(action.id))
            .map((action) => action.id);

          actionsIdsNotFetched.forEach((actionId) => removeAction(actionId));
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
    useCreateAction: () => {
      const created = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async create(newAction: ActionCreateInput): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/actions`, {
            method: "post",
            body: newAction,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useAction().setAction(data.action);

          // Set `created` ref so create button can be disabled
          // forever once we've had a successful creation.
          created.value = true;

          return data.action.id;
        },
        created,
        loading,
        error,
        errorMessage,
      };
    },
    useUpdateAction: () => {
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async update(updatedAction: ActionUpdateInput): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/actions/${updatedAction.id}`, {
            method: "put",
            body: updatedAction,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useAction().setAction(data.action);

          return data.action.id;
        },
        loading,
        error,
        errorMessage,
      };
    },
    useDeleteAction: () => {
      const deleted = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async deleteFn(deleteActionId: number): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/actions/${deleteActionId}`, {
            method: "delete",
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useAction().removeAction(data.action.id);

          // Set `deleted` ref so delete button can be disabled
          // forever once we've had a successful creation.
          deleted.value = true;

          return data.action.id;
        },
        deleted,
        loading,
        error,
        errorMessage,
      };
    },
  };
};
