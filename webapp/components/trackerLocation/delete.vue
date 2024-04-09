<script setup lang="ts">
import type { TrackerLocationData } from "~/server/types/trackerLocation";
const { useDeleteTrackerLocation } = useTrackerLocation();
const { deleteFn, deleted, loading, error, errorMessage } =
  useDeleteTrackerLocation();

const emit = defineEmits<{
  deleted: [id: number];
}>();
const props = defineProps<{
  trackerLocation: TrackerLocationData;
}>();

async function submitDelete() {
  const trackerLocationId = await deleteFn(props.trackerLocation.id);

  if (trackerLocationId) {
    emit("deleted", trackerLocationId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Delete TrackerLocation</legend>

      <div style="color: red">
        Just checking that you are wanting to delete the trackerLocation:<br />
        "{{ trackerLocation.datetime }}" [id={{ trackerLocation.id }}]
      </div>

      <div v-if="error">{{ errorMessage }}</div>

      <div class="form-actions">
        <button
          type="button"
          @click="submitDelete"
          :disabled="loading || deleted"
        >
          Delete TrackerLocation
        </button>
      </div>
    </fieldset>
  </form>
</template>
