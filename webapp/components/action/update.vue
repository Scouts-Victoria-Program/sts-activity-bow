<script setup lang="ts">
import type { ActionData, ActionUpdateInput } from "~/server/types/action";
const { useUpdateAction } = useAction();
const { update, loading, error, errorMessage } = useUpdateAction();

const emit = defineEmits<{
  updated: [id: number];
}>();
const props = defineProps<{
  action: ActionData;
}>();

const newAction = ref<ActionUpdateInput>({
  id: props.action.id,
  datetime: props.action.datetime,
  action: props.action.action,
  score: props.action.score,
  teamId: props.action.teamId,
  description: props.action.description,
});

async function submitUpdate() {
  const reqBody: ActionUpdateInput = {
    id: newAction.value.id,
    datetime: newAction.value.datetime,
    action: newAction.value.action,
    score: newAction.value.score,
    teamId: newAction.value.teamId,
    description: newAction.value.description,
  };

  const actionId = await update(reqBody);

  if (actionId) {
    emit("updated", actionId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Update Action</legend>
      <div>
        <p>ID: {{ newAction.id }}</p>
      </div>
      <div class="form-row">
        <label for="form-action-update-action">action</label>
        <select id="form-action-update-action" v-model="newAction.action">
          <option value="violation">Violation</option>
          <option value="respawn">Respawn</option>
          <option value="death">Death</option>
          <option value="chance">Game of Chance</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="form-row">
        <label for="form-action-update-score">score</label>
        <input
          type="number"
          id="form-action-update-score"
          v-model="newAction.score"
        />
      </div>
      <div class="form-row">
        <label for="form-log-create-description">Description</label>
        <input
          id="form-log-create-description"
          v-model="newAction.description"
        />
      </div>
      <div class="form-row">
        <label for="form-log-create-team">Team</label>
        <input
          type="number"
          id="form-log-create-team"
          v-model="newAction.teamId"
        />
      </div>
      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button type="button" @click="submitUpdate" :disabled="loading">
          Update Action
        </button>
      </div>
    </fieldset>
  </form>
</template>
