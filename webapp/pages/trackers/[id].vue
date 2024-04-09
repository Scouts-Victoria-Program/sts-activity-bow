<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Tracker",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/trackers`, label: `Trackers` },
    { to: ``, label: `Tracker` },
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
const { data, refresh, pending } = useFetch(`/api/trackers/${route.params.id}`);

const showTrackerUpdate = useState("showTrackerUpdate", () => false);
function trackerUpdated(id: number) {
  showTrackerUpdate.value = false;
  refresh();
}

const showTrackerDelete = useState("showTrackerDelete", () => false);
function trackerDeleted(id: number) {
  showTrackerDelete.value = false;
  const router = useRouter();
  router.push(`/trackers`);
}
</script>

<template>
  <div v-if="data && data.success && !pending">
    <h2>Tracker: {{ data.tracker.name }}</h2>
    <button type="button" @click="showTrackerUpdate = !showTrackerUpdate">
      {{ showTrackerUpdate ? "Hide" : "Show" }} Update Tracker
    </button>
    <TrackerUpdate
      v-if="showTrackerUpdate"
      :tracker="data.tracker"
      @updated="trackerUpdated"
    ></TrackerUpdate>

    <button type="button" @click="showTrackerDelete = !showTrackerDelete">
      {{ showTrackerDelete ? "Hide" : "Show" }} Delete Tracker
    </button>
    <TrackerDelete
      v-if="showTrackerDelete"
      :tracker="data.tracker"
      @deleted="trackerDeleted"
    ></TrackerDelete>

    <div>ID: {{ data.tracker.id }}</div>
    <div>Name: {{ data.tracker.name }}</div>
    <div>Score Modifier: {{ data.tracker.scoreModifier }}</div>

    <TrackerLocationList :tracker="data.tracker"></TrackerLocationList>
  </div>
  <div v-else>loading or error</div>
</template>
