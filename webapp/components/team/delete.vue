<script setup lang="ts">
import type { TeamData } from "~/server/types/team";
const { useDeleteTeam } = useTeam();
const { deleteFn, deleted, loading, error, errorMessage } = useDeleteTeam();

const emit = defineEmits<{
  deleted: [id: number];
}>();
const props = defineProps<{
  team: TeamData;
}>();

async function submitDelete() {
  const teamId = await deleteFn(props.team.id);

  if (teamId) {
    emit("deleted", teamId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Delete Team</legend>

      <div style="color: red">
        Just checking that you are wanting to delete the team:<br />
        "{{ team.name }}" [id={{ team.id }}]
      </div>

      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button
          type="button"
          @click="submitDelete"
          :disabled="loading || deleted"
        >
          Delete Team
        </button>
      </div>
    </fieldset>
  </form>
</template>
