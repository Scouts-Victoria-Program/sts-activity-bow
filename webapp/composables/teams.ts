import type {
  TeamData,
  TeamCreateInput,
  TeamUpdateInput,
} from "~/server/types/team";
import { usePageControls } from "./pageControls";

interface FetchTeamComposable {
  team: ComputedRef<TeamData | null>;
  loading: Ref<boolean>;
}

// This is not good practice and you should never store state outside
// the composable constructor function. I havent been able to work out
// how to better define per entity composable fns.
const fetchTeamComposable: Record<string, FetchTeamComposable> = {};

export const useTeam = () => {
  const teamsState = useState<Record<string, TeamData>>("teams", () => ({}));

  return {
    teams: teamsState,
    getTeam(id: number): ComputedRef<TeamData | null> {
      return computed(() => teamsState.value[String(id)] ?? null);
    },
    setTeam(team: TeamData): void {
      teamsState.value[String(team.id)] = team;
    },
    setTeams(teams: TeamData[]): void {
      teams.forEach((team) => (teamsState.value[String(team.id)] = team));
    },
    removeTeam(teamId: number): void {
      delete teamsState.value[String(teamId)];
    },
    useFetchTeam: (teamId: number | null): FetchTeamComposable => {
      if (teamId === null) {
        return {
          team: computed(() => null),
          loading: ref(false),
        };
      }

      if (fetchTeamComposable[teamId]) {
        return fetchTeamComposable[teamId];
      }

      const { data, pending } = useFetch(`/api/teams/${teamId}`, {});

      fetchTeamComposable[teamId] = {
        team: useTeam().getTeam(teamId),
        loading: pending,
      };

      watch(data, (value) => {
        if (!value?.success) {
          return;
        }
        useTeam().setTeam(value.team);
      });

      return fetchTeamComposable[teamId];
    },
    useListTeams: () => {
      const { currentPage, useUiPageControls } = usePageControls();

      const { data, refresh, pending } = useFetch(`/api/teams`, {
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
        useTeam().setTeams(value.teams);
      });

      return {
        displayTeams: computed(() => {
          if (!data.value?.success) {
            return [];
          }

          return data.value?.teams
            .map(({ id: teamId }) => useTeam().getTeam(teamId).value)
            .filter((team): team is TeamData => team !== null);
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
          return "Unable to fetch team list";
        }),
      };
    },
    useListAllTeams: () => {
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      async function fetchTeamPage(page: number = 1): Promise<number[]> {
        const { data } = await useFetch(`/api/teams`, {
          params: { page: page },
        });

        if (!data.value?.success) {
          error.value = true;
          errorMessage.value = data.value?.message;
          return [];
        }

        useTeam().setTeams(data.value.teams);

        const teamIds = data.value.teams.map((team) => team.id);

        if (data.value.maxPages <= page) {
          return teamIds; // Team Ids from last page.
        }

        return [
          ...teamIds, // Team Ids from current page.
          ...(await fetchTeamPage(page + 1)), // Team Ids from future pages.
        ];
      }

      const pending = ref<boolean>(true);

      fetchTeamPage()
        .then((teamIdsFetched) => {
          const { teams, removeTeam } = useTeam();

          const teamsIdsNotFetched = Object.values(teams)
            .filter((team) => !teamIdsFetched.includes(team.id))
            .map((team) => team.id);

          teamsIdsNotFetched.forEach((teamId) => removeTeam(teamId));
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
    useCreateTeam: () => {
      const created = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async create(newTeam: TeamCreateInput): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/teams`, {
            method: "post",
            body: newTeam,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useTeam().setTeam(data.team);

          // Set `created` ref so create button can be disabled
          // forever once we've had a successful creation.
          created.value = true;

          return data.team.id;
        },
        created,
        loading,
        error,
        errorMessage,
      };
    },
    useUpdateTeam: () => {
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async update(updatedTeam: TeamUpdateInput): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/teams/${updatedTeam.id}`, {
            method: "put",
            body: updatedTeam,
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useTeam().setTeam(data.team);

          return data.team.id;
        },
        loading,
        error,
        errorMessage,
      };
    },
    useDeleteTeam: () => {
      const deleted = ref<boolean>(false);
      const loading = ref<boolean>(false);
      const error = ref<boolean>(false);
      const errorMessage = ref<string | undefined>(undefined);

      return {
        async deleteFn(deleteTeamId: number): Promise<number | null> {
          loading.value = true;
          error.value = false;
          errorMessage.value = undefined;
          const data = await $fetch(`/api/teams/${deleteTeamId}`, {
            method: "delete",
          });

          if (data.success === false) {
            loading.value = false;
            error.value = true;
            errorMessage.value = data.message ?? "";
            return null;
          }

          useTeam().removeTeam(data.team.id);

          // Set `deleted` ref so delete button can be disabled
          // forever once we've had a successful creation.
          deleted.value = true;

          return data.team.id;
        },
        deleted,
        loading,
        error,
        errorMessage,
      };
    },
  };
};
