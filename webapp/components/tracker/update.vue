<script setup lang="ts">
import type { TrackerData, TrackerUpdateInput } from "~/server/types/tracker";
const { useUpdateTracker } = useTracker();
const { update, loading, error, errorMessage } = useUpdateTracker();

const emit = defineEmits<{
  updated: [id: number];
}>();
const props = defineProps<{
  tracker: TrackerData;
}>();

const newTracker = ref<TrackerUpdateInput>({
  id: props.tracker.id,
  deviceId: props.tracker.deviceId,
  name: props.tracker.name,
  scoreModifier: props.tracker.scoreModifier,
});

async function submitUpdate() {
  const reqBody: TrackerUpdateInput = {
    id: newTracker.value.id,
    deviceId: newTracker.value.deviceId,
    name: newTracker.value.name,
    scoreModifier: newTracker.value.scoreModifier,
  };
  const trackerId = await update(reqBody);

  if (trackerId) {
    emit("updated", trackerId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Update Tracker</legend>
      <div>
        <p>ID: {{ newTracker.id }}</p>
      </div>
      <div class="form-row">
        <label for="form-tracker-update-device-id">Tracker Device Id</label>
        <input
          id="form-tracker-update-device-id"
          v-model="newTracker.deviceId"
        />
      </div>
      <div class="form-row">
        <label for="form-tracker-update-name">Tracker name</label>
        <input id="form-tracker-update-name" v-model="newTracker.name" />
      </div>
      <div class="form-row">
        <label for="form-tracker-update-score-modifier">
          Tracker score modifier
        </label>
        <input
          id="form-tracker-update-score-modifier"
          type="number"
          v-model="newTracker.scoreModifier"
        />
      </div>
      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button type="button" @click="submitUpdate" :disabled="loading">
          Update Tracker
        </button>
      </div>
    </fieldset>
  </form>
</template>
