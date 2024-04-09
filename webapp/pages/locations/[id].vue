<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";
import { DateTime } from "luxon";

useHead({
  title: "TrackerLocation",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/locations`, label: `TrackerLocations` },
    { to: ``, label: `TrackerLocation` },
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
const { data, refresh, pending } = useFetch(
  `/api/locations/${route.params.id}`
);

const showTrackerLocationUpdate = useState(
  "showTrackerLocationUpdate",
  () => false
);
function trackerlocationUpdated(id: number) {
  showTrackerLocationUpdate.value = false;
  refresh();
}

const showTrackerLocationDelete = useState(
  "showTrackerLocationDelete",
  () => false
);
function trackerlocationDeleted(id: number) {
  showTrackerLocationDelete.value = false;
  const router = useRouter();
  router.push(`/locations`);
}
</script>

<template>
  <div v-if="data && data.success && !pending">
    <h2>TrackerLocation: {{ data.trackerlocation.trackerId }}</h2>
    <button
      type="button"
      @click="showTrackerLocationUpdate = !showTrackerLocationUpdate"
    >
      {{ showTrackerLocationUpdate ? "Hide" : "Show" }} Update TrackerLocation
    </button>
    <TrackerLocationUpdate
      v-if="showTrackerLocationUpdate"
      :trackerlocation="data.trackerlocation"
      @updated="trackerlocationUpdated"
    ></TrackerLocationUpdate>

    <button
      type="button"
      @click="showTrackerLocationDelete = !showTrackerLocationDelete"
    >
      {{ showTrackerLocationDelete ? "Hide" : "Show" }} Delete TrackerLocation
    </button>
    <TrackerLocationDelete
      v-if="showTrackerLocationDelete"
      :trackerlocation="data.trackerlocation"
      @deleted="trackerlocationDeleted"
    ></TrackerLocationDelete>

    <div>ID: {{ data.trackerlocation.id }}</div>
    <div>
      Datetime:
      {{
        DateTime.fromISO(data.trackerlocation.datetime).toLocaleString(
          DateTime.DATETIME_SHORT
        )
      }}
    </div>
    <div>WindowSize: {{ data.trackerlocation.windowSize }}</div>
    <div>ScoreModifier: {{ data.trackerlocation.scoreModifier }}</div>
    <div>Lat: {{ data.trackerlocation.lat }}</div>
    <div>Long: {{ data.trackerlocation.long }}</div>
    <div>TrackerId: {{ data.trackerlocation.trackerId }}</div>
    <div>BaseId: {{ data.trackerlocation.baseId }}</div>
    <div>Distance: {{ data.trackerlocation.distance }}</div>
  </div>
  <div v-else>loading or error</div>
</template>
