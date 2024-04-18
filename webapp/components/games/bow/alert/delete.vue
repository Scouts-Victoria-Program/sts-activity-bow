<script setup lang="ts">
import type { BowAlertData } from "~/server/types/bowAlert";
const { useDeleteBowAlert } = useBowAlert();
const { deleteFn, deleted, loading, error, errorMessage } = useDeleteBowAlert();

const emit = defineEmits<{
  deleted: [id: number];
}>();
const props = defineProps<{
  bowAlert: BowAlertData;
}>();

async function submitDelete() {
  const bowAlertId = await deleteFn(props.bowAlert.id);

  if (bowAlertId) {
    emit("deleted", bowAlertId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Delete BowAlert</legend>

      <div style="color: red">
        Just checking that you are wanting to delete the bowAlert:<br />
        "{{ bowAlert.name }}" [id={{ bowAlert.id }}]
      </div>

      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button
          type="button"
          @click="submitDelete"
          :disabled="loading || deleted"
        >
          Delete BowAlert
        </button>
      </div>
    </fieldset>
  </form>
</template>
