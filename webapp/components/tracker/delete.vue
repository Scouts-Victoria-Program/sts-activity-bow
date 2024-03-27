<script setup lang="ts">
import type { TrackerData } from "~/server/types/tracker";
const { useDeleteTracker } = useTracker();
const { deleteFn, deleted, loading, error, errorMessage } = useDeleteTracker();

const emit = defineEmits<{
  deleted: [id: number];
}>();
const props = defineProps<{
  tracker: TrackerData;
}>();

async function submitDelete() {
  const trackerId = await deleteFn(props.tracker.id);

  if (trackerId) {
    emit("deleted", trackerId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Delete Tracker</legend>

      <div style="color: red">
        Just checking that you are wanting to delete the tracker:<br />
        "{{ tracker.name }}" [id={{ tracker.id }}]
      </div>

      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button
          type="button"
          @click="submitDelete"
          :disabled="loading || deleted"
        >
          Delete Tracker
        </button>
      </div>
    </fieldset>
  </form>
</template>
