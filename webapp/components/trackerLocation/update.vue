<script setup lang="ts">
import type {
  TrackerLocationData,
  TrackerLocationUpdateInput,
} from "~/server/types/trackerLocation";
const { useUpdateTrackerLocation } = useTrackerLocation();
const { update, loading, error, errorMessage } = useUpdateTrackerLocation();

const emit = defineEmits<{
  updated: [id: number];
}>();
const props = defineProps<{
  trackerLocation: TrackerLocationData;
}>();

const newTrackerLocation = ref<TrackerLocationUpdateInput>({
  id: props.trackerLocation.id,
  datetime: props.trackerLocation.datetime,
  windowSize: props.trackerLocation.windowSize,
  scoreModifier: props.trackerLocation.scoreModifier,
  lat: props.trackerLocation.lat,
  long: props.trackerLocation.long,
  trackerId: props.trackerLocation.trackerId,
  baseId: props.trackerLocation.baseId,
  distance: props.trackerLocation.distance,
});

async function submitUpdate() {
  const reqBody: TrackerLocationUpdateInput = {
    id: newTrackerLocation.value.id,
    datetime: newTrackerLocation.value.datetime,
    windowSize: newTrackerLocation.value.windowSize,
    scoreModifier: newTrackerLocation.value.scoreModifier,
    lat: newTrackerLocation.value.lat,
    long: newTrackerLocation.value.long,
    trackerId: newTrackerLocation.value.trackerId,
    baseId: newTrackerLocation.value.baseId,
    distance: newTrackerLocation.value.distance,
  };

  const trackerLocationId = await update(reqBody);

  if (trackerLocationId) {
    emit("updated", trackerLocationId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Update TrackerLocation</legend>
      <div>
        <p>ID: {{ newTrackerLocation.id }}</p>
      </div>
      <div class="form-row">
        <label for="form-trackerLocation-update-window-size">windowSize</label>
        <input
          type="number"
          id="form-trackerLocation-update-window-size"
          v-model="newTrackerLocation.windowSize"
        />
      </div>
      <div class="form-row">
        <label for="form-trackerLocation-update-score-modifier"
          >scoreModifier</label
        >
        <input
          type="number"
          id="form-trackerLocation-update-score-modifier"
          v-model="newTrackerLocation.scoreModifier"
        />
      </div>
      <div class="form-row">
        <label for="form-log-create-lat">Lat</label>
        <input
          type="number"
          id="form-log-create-lat"
          v-model="newTrackerLocation.lat"
        />
      </div>
      <div class="form-row">
        <label for="form-log-create-long">Long</label>
        <input
          type="number"
          id="form-log-create-long"
          v-model="newTrackerLocation.long"
        />
      </div>
      <div class="form-row">
        <label for="form-log-create-tracker">Tracker</label>
        <input
          id="form-log-create-tracker"
          v-model="newTrackerLocation.trackerId"
        />
      </div>
      <div class="form-row">
        <label for="form-log-create-base">Base</label>
        <input id="form-log-create-base" v-model="newTrackerLocation.baseId" />
      </div>
      <div class="form-row">
        <label for="form-log-create-distance">Distance</label>
        <input
          type="number"
          id="form-log-create-distance"
          v-model="newTrackerLocation.distance"
        />
      </div>
      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button type="button" @click="submitUpdate" :disabled="loading">
          Update TrackerLocation
        </button>
      </div>
    </fieldset>
  </form>
</template>
