<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";
import { DateTime } from "luxon";

useHead({
  title: "Flag",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/flags`, label: `Flags` },
    { to: ``, label: `Flag` },
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
const { data, refresh, pending } = useFetch(`/api/flags/${route.params.id}`);

const showFlagUpdate = useState("showFlagUpdate", () => false);
function flagUpdated(id: number) {
  showFlagUpdate.value = false;
  refresh();
}

const showFlagDelete = useState("showFlagDelete", () => false);
function flagDeleted(id: number) {
  showFlagDelete.value = false;
  const router = useRouter();
  router.push(`/flags`);
}
</script>

<template>
  <div v-if="data && data.success && !pending">
    <h2>Flag: {{ data.flag.trackerId }}</h2>
    <button type="button" @click="showFlagUpdate = !showFlagUpdate">
      {{ showFlagUpdate ? "Hide" : "Show" }} Update Flag
    </button>
    <FlagUpdate
      v-if="showFlagUpdate"
      :flag="data.flag"
      @updated="flagUpdated"
    ></FlagUpdate>

    <button type="button" @click="showFlagDelete = !showFlagDelete">
      {{ showFlagDelete ? "Hide" : "Show" }} Delete Flag
    </button>
    <FlagDelete
      v-if="showFlagDelete"
      :flag="data.flag"
      @deleted="flagDeleted"
    ></FlagDelete>

    <div>ID: {{ data.flag.id }}</div>
    <div>
      Datetime:
      {{
        DateTime.fromISO(data.flag.datetime).toLocaleString(
          DateTime.DATETIME_SHORT
        )
      }}
    </div>
    <div>WindowSize: {{ data.flag.windowSize }}</div>
    <div>ScoreModifier: {{ data.flag.scoreModifier }}</div>
    <div>Lat: {{ data.flag.lat }}</div>
    <div>Long: {{ data.flag.long }}</div>
    <div>TrackerId: {{ data.flag.trackerId }}</div>
    <div>TeamId: {{ data.flag.teamId }}</div>
    <div>Distance: {{ data.flag.distance }}</div>
  </div>
  <div v-else>loading or error</div>
</template>
