<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";
import { DateTime } from "luxon";

useHead({
  title: "Log",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/logs`, label: `Logs` },
    { to: ``, label: `Log` },
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
const { data, refresh, pending } = useFetch(`/api/logs/${route.params.id}`);

const showLogUpdate = useState("showLogUpdate", () => false);
function logUpdated(id: number) {
  showLogUpdate.value = false;
  refresh();
}

const showLogDelete = useState("showLogDelete", () => false);
function logDeleted(id: number) {
  showLogDelete.value = false;
  const router = useRouter();
  router.push(`/logs`);
}
</script>

<template>
  <div v-if="data && data.success && !pending">
    <h2>Log: {{ data.log.tracker.name }} @ {{ data.log.datetime }}</h2>
    <button type="button" @click="showLogUpdate = !showLogUpdate">
      {{ showLogUpdate ? "Hide" : "Show" }} Update Log
    </button>
    <LogUpdate
      v-if="showLogUpdate"
      :log="data.log"
      @updated="logUpdated"
    ></LogUpdate>

    <button type="button" @click="showLogDelete = !showLogDelete">
      {{ showLogDelete ? "Hide" : "Show" }} Delete Log
    </button>
    <LogDelete
      v-if="showLogDelete"
      :log="data.log"
      @deleted="logDeleted"
    ></LogDelete>

    <div>ID: {{ data.log.id }}</div>
    <div>
      Datetime:
      {{
        DateTime.fromISO(data.log.datetime).toLocaleString(
          DateTime.DATETIME_SHORT
        )
      }}
    </div>
    <div>Lat: {{ data.log.lat }}</div>
    <div>Long: {{ data.log.long }}</div>
    <div>Tracker: {{ data.log.trackerId }}</div>
    <div>Team: {{ data.log.teamId ?? "none" }}</div>
    <div>Distance: {{ data.log.distance }}</div>
  </div>
  <div v-else>loading or error</div>
</template>
