<script setup lang="ts">
import type { TrackerLocationData } from "~/server/types/trackerlocation";
const { useDeleteTrackerLocation } = useTrackerLocation();
const { deleteFn, deleted, loading, error, errorMessage } =
  useDeleteTrackerLocation();

const emit = defineEmits<{
  deleted: [id: number];
}>();
const props = defineProps<{
  trackerlocation: TrackerLocationData;
}>();

async function submitDelete() {
  const trackerlocationId = await deleteFn(props.trackerlocation.id);

  if (trackerlocationId) {
    emit("deleted", trackerlocationId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Delete TrackerLocation</legend>

      <div style="color: red">
        Just checking that you are wanting to delete the trackerlocation:<br />
        "{{ trackerlocation.datetime }}" [id={{ trackerlocation.id }}]
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
