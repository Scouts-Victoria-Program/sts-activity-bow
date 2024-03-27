<script setup lang="ts">
import type { LogData } from "~/server/types/log";
const { useDeleteLog } = useLog();
const { deleteFn, deleted, loading, error, errorMessage } = useDeleteLog();

const emit = defineEmits<{
  deleted: [id: number];
}>();
const props = defineProps<{
  log: LogData;
}>();

async function submitDelete() {
  const logId = await deleteFn(props.log.id);

  if (logId) {
    emit("deleted", logId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Delete Log</legend>

      <div style="color: red">
        Just checking that you are wanting to delete the log:<br />
        "{{ log.datetime }}" [id={{ log.id }}]
      </div>

      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button
          type="button"
          @click="submitDelete"
          :disabled="loading || deleted"
        >
          Delete Log
        </button>
      </div>
    </fieldset>
  </form>
</template>
