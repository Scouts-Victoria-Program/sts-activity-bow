<script setup lang="ts">
import { ActionOptions, type ActionCreateInput } from "~/server/types/action";
import type { TeamData } from "~/server/types/team";

const props = defineProps<{
  team?: TeamData;
}>();

const { useCreateAction } = useAction();
const { create, created, loading, error, errorMessage } = useCreateAction();

const emit = defineEmits<{
  created: [id: number];
}>();
const newAction = ref<ActionCreateInput>({
  datetime: new Date().toISOString(),
  action: "other",
  score: 0,
  teamId: props.team?.id ?? 0,
  description: "",
});

async function submitCreate() {
  const reqBody: ActionCreateInput = {
    datetime: newAction.value.datetime,
    action: newAction.value.action,
    score: newAction.value.score,
    teamId: newAction.value.teamId,
    description: newAction.value.description,
  };
  const actionId = await create(reqBody);

  if (actionId) {
    emit("created", actionId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Create Action</legend>
      <div class="form-row">
        <label for="form-action-update-action">action</label>
        <select id="form-action-update-action" v-model="newAction.action">
          <option v-for="(label, key) in ActionOptions" :key="key" :value="key">
            {{ label }}
          </option>
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
        <button
          type="button"
          @click="submitCreate"
          :disabled="loading || created"
        >
          Create Action
        </button>
      </div>
    </fieldset>
  </form>
</template>
