<script setup lang="ts">
import type { ActionData } from "~/server/types/action";
const { useDeleteAction } = useAction();
const { deleteFn, deleted, loading, error, errorMessage } = useDeleteAction();

const emit = defineEmits<{
  deleted: [id: number];
}>();
const props = defineProps<{
  action: ActionData;
}>();

async function submitDelete() {
  const actionId = await deleteFn(props.action.id);

  if (actionId) {
    emit("deleted", actionId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Delete Action</legend>

      <div style="color: red">
        Just checking that you are wanting to delete the action:<br />
        "{{ action.description }}" [id={{ action.id }}]
      </div>

      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button
          type="button"
          @click="submitDelete"
          :disabled="loading || deleted"
        >
          Delete Action
        </button>
      </div>
    </fieldset>
  </form>
</template>
