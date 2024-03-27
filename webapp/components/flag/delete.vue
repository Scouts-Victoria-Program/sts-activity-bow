<script setup lang="ts">
import type { FlagData } from "~/server/types/flag";
const { useDeleteFlag } = useFlag();
const { deleteFn, deleted, loading, error, errorMessage } = useDeleteFlag();

const emit = defineEmits<{
  deleted: [id: number];
}>();
const props = defineProps<{
  flag: FlagData;
}>();

async function submitDelete() {
  const flagId = await deleteFn(props.flag.id);

  if (flagId) {
    emit("deleted", flagId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Delete Flag</legend>

      <div style="color: red">
        Just checking that you are wanting to delete the flag:<br />
        "{{ flag.datetime }}" [id={{ flag.id }}]
      </div>

      <div v-if="error">{{ errorMessage }}</div>

      <div class="form-actions">
        <button
          type="button"
          @click="submitDelete"
          :disabled="loading || deleted"
        >
          Delete Flag
        </button>
      </div>
    </fieldset>
  </form>
</template>
