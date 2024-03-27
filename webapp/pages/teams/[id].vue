<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Team",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/teams`, label: `Teams` },
    { to: ``, label: `Team` },
  ]),

  validate: async (route) => {
    if (Array.isArray(route.params.id)) {
      return false;
    }

    // Check if the id is made up of digits
    return /^\d+$/.test(route.params.id);
  },
});
const route = useRoute();
const { data, refresh, pending } = useFetch(`/api/teams/${route.params.id}`);

const showTeamUpdate = useState("showTeamUpdate", () => false);
function teamUpdated(id: number) {
  showTeamUpdate.value = false;
  refresh();
}

const showTeamDelete = useState("showTeamDelete", () => false);
function teamDeleted(id: number) {
  showTeamDelete.value = false;
  const router = useRouter();
  router.push(`/teams`);
}
</script>

<template>
  <div v-if="data && data.success && !pending">
    <h2>Team: {{ data.team.name }}</h2>
    <button type="button" @click="showTeamUpdate = !showTeamUpdate">
      {{ showTeamUpdate ? "Hide" : "Show" }} Update Team
    </button>
    <TeamUpdate
      v-if="showTeamUpdate"
      :team="data.team"
      @updated="teamUpdated"
    ></TeamUpdate>

    <button type="button" @click="showTeamDelete = !showTeamDelete">
      {{ showTeamDelete ? "Hide" : "Show" }} Delete Team
    </button>
    <TeamDelete
      v-if="showTeamDelete"
      :team="data.team"
      @deleted="teamDeleted"
    ></TeamDelete>

    <div>ID: {{ data.team.id }}</div>
    <div>Name: {{ data.team.name }}</div>
    <div>Lat: {{ data.team.flagZoneLat }}</div>
    <div>Long: {{ data.team.flagZoneLong }}</div>

    <ActionList :team="data.team"></ActionList>
    <FlagList :team="data.team"></FlagList>
  </div>
  <div v-else>loading or error</div>
</template>
