<script setup lang="ts">
import type { TrackerCreateInput } from "~/server/types/tracker";
const { useCreateTracker } = useTracker();
const { create, created, loading, error, errorMessage } = useCreateTracker();

const emit = defineEmits<{
  created: [id: number];
}>();
const newTracker = ref<TrackerCreateInput>({
  deviceId: "",
  name: "",
  scoreModifier: 1,
});

async function submitCreate() {
  const reqBody: TrackerCreateInput = {
    deviceId: newTracker.value.deviceId,
    name: newTracker.value.name,
    scoreModifier: newTracker.value.scoreModifier,
  };
  const trackerId = await create(reqBody);

  if (trackerId) {
    emit("created", trackerId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Create Tracker</legend>
      <div class="form-row">
        <label for="form-tracker-create-device-id">Tracker Device Id</label>
        <input
          id="form-tracker-create-device-id"
          v-model="newTracker.deviceId"
        />
      </div>
      <div class="form-row">
        <label for="form-tracker-create-name">Tracker name</label>
        <input id="form-tracker-create-name" v-model="newTracker.name" />
      </div>
      <div class="form-row">
        <label for="form-tracker-create-score-modifier"
          >Tracker score modifier</label
        >
        <input
          id="form-tracker-create-score-modifier"
          type="number"
          v-model="newTracker.scoreModifier"
        />
      </div>
      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button
          type="button"
          @click="submitCreate"
          :disabled="loading || created"
        >
          Create Tracker
        </button>
      </div>
    </fieldset>
  </form>
</template>
