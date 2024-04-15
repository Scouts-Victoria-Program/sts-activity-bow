<script setup lang="ts">
import type { TrackerCreateInput } from "~/server/types/tracker";
const { useCreateTracker } = useTracker();
const { create, created, loading, error, errorMessage } = useCreateTracker();

const emit = defineEmits<{
  created: [];
}>();
const bulkField = ref<string>("");

const parsedTrackerData = computed((): TrackerCreateInput[] => {
  const trimmed = bulkField.value.trim();

  if (trimmed === "") {
    return [];
  }

  const rows = trimmed.split("\n").filter((row) => row.trim() !== "");

  const newTrackers: TrackerCreateInput[] = rows.map(
    (row): TrackerCreateInput => {
      const values = row.split(",");

      return {
        deviceId: values[0]?.trim(),
        name: values[1]?.trim(),
        scoreModifier: Number(values[2]?.trim() ?? 0),
      };
    }
  );

  return newTrackers;
});

const requestStatus = ref<Record<string, string>>({});
function getStatus(index: number): string {
  return requestStatus.value[String(index)] ?? "";
}

async function submitBulkCreate() {
  for (const index in parsedTrackerData.value) {
    const newTracker = parsedTrackerData.value[index];

    requestStatus.value[index] = `Creating`;
    const trackerId = await create(newTracker);
    requestStatus.value[index] = `Created ${trackerId}`;
  }

  emit("created");
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Create Tracker</legend>
      <div class="form-row">
        <label for="form-tracker-create">Bulk Create</label>
        <textarea
          id="form-tracker-create"
          v-model="bulkField"
          placeholder="deviceId,name,scoreModifier"
        ></textarea>
      </div>
      <table>
        <thead>
          <tr>
            <th>Device Id</th>
            <th>Name</th>
            <th>ScoreModifier</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(tracker, index) in parsedTrackerData" :key="index">
            <td>{{ tracker.deviceId }}</td>
            <td>{{ tracker.name }}</td>
            <td>{{ tracker.scoreModifier }}</td>
            <td>{{ getStatus(index) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button
          type="button"
          @click="submitBulkCreate"
          :disabled="loading || created"
        >
          Create Trackers
        </button>
      </div>
    </fieldset>
  </form>
</template>
