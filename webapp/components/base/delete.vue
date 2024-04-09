<script setup lang="ts">
import type { BaseData } from "~/server/types/base";
const { useDeleteBase } = useBase();
const { deleteFn, deleted, loading, error, errorMessage } = useDeleteBase();

const emit = defineEmits<{
  deleted: [id: number];
}>();
const props = defineProps<{
  base: BaseData;
}>();

async function submitDelete() {
  const baseId = await deleteFn(props.base.id);

  if (baseId) {
    emit("deleted", baseId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Delete Base</legend>

      <div style="color: red">
        Just checking that you are wanting to delete the base:<br />
        "{{ base.name }}" [id={{ base.id }}]
      </div>

      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button
          type="button"
          @click="submitDelete"
          :disabled="loading || deleted"
        >
          Delete Base
        </button>
      </div>
    </fieldset>
  </form>
</template>
