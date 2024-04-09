<script setup lang="ts">
import type { TrackerLocationCreateInput } from "~/server/types/trackerLocation";
import type { BaseData } from "~/server/types/base";
import type { TrackerData } from "~/server/types/tracker";

const props = defineProps<{
  base?: BaseData;
  tracker?: TrackerData;
}>();

const { useCreateTrackerLocation } = useTrackerLocation();
const { create, created, loading, error, errorMessage } =
  useCreateTrackerLocation();

const emit = defineEmits<{
  created: [id: number];
}>();
const newTrackerLocation = ref<TrackerLocationCreateInput>({
  datetime: new Date().toISOString(),
  windowSize: 0,
  scoreModifier: 0,
  lat: 0,
  long: 0,
  trackerId: props.tracker?.id ?? 0,
  baseId: props.base?.id ?? 0,
  distance: 0,
});

async function submitCreate() {
  const reqBody: TrackerLocationCreateInput = {
    datetime: newTrackerLocation.value.datetime,
    windowSize: newTrackerLocation.value.windowSize,
    scoreModifier: newTrackerLocation.value.scoreModifier,
    lat: newTrackerLocation.value.lat,
    long: newTrackerLocation.value.long,
    trackerId: newTrackerLocation.value.trackerId,
    baseId: newTrackerLocation.value.baseId,
    distance: newTrackerLocation.value.distance,
  };
  const trackerLocationId = await create(reqBody);

  if (trackerLocationId) {
    emit("created", trackerLocationId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Create TrackerLocation</legend>
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
        <button
          type="button"
          @click="submitCreate"
          :disabled="loading || created"
        >
          Create TrackerLocation
        </button>
      </div>
    </fieldset>
  </form>
</template>
