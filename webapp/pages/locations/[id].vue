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
function trackerLocationUpdated(id: number) {
  showTrackerLocationUpdate.value = false;
  refresh();
}

const showTrackerLocationDelete = useState(
  "showTrackerLocationDelete",
  () => false
);
function trackerLocationDeleted(id: number) {
  showTrackerLocationDelete.value = false;
  const router = useRouter();
  router.push(`/locations`);
}
</script>

<template>
  <div v-if="data && data.success && !pending">
    <h2>TrackerLocation: {{ data.trackerLocation.trackerId }}</h2>
    <button
      type="button"
      @click="showTrackerLocationUpdate = !showTrackerLocationUpdate"
    >
      {{ showTrackerLocationUpdate ? "Hide" : "Show" }} Update TrackerLocation
    </button>
    <TrackerLocationUpdate
      v-if="showTrackerLocationUpdate"
      :trackerLocation="data.trackerLocation"
      @updated="trackerLocationUpdated"
    ></TrackerLocationUpdate>

    <button
      type="button"
      @click="showTrackerLocationDelete = !showTrackerLocationDelete"
    >
      {{ showTrackerLocationDelete ? "Hide" : "Show" }} Delete TrackerLocation
    </button>
    <TrackerLocationDelete
      v-if="showTrackerLocationDelete"
      :trackerLocation="data.trackerLocation"
      @deleted="trackerLocationDeleted"
    ></TrackerLocationDelete>

    <div>ID: {{ data.trackerLocation.id }}</div>
    <div>
      Datetime:
      {{
        DateTime.fromISO(data.trackerLocation.datetime).toLocaleString(
          DateTime.DATETIME_SHORT
        )
      }}
    </div>
    <div>WindowSize: {{ data.trackerLocation.windowSize }}</div>
    <div>ScoreModifier: {{ data.trackerLocation.scoreModifier }}</div>
    <div>Lat: {{ data.trackerLocation.lat }}</div>
    <div>Long: {{ data.trackerLocation.long }}</div>
    <div>TrackerId: {{ data.trackerLocation.trackerId }}</div>
    <div>BaseId: {{ data.trackerLocation.baseId }}</div>
    <div>Distance: {{ data.trackerLocation.distance }}</div>
  </div>
  <div v-else>loading or error</div>
</template>
