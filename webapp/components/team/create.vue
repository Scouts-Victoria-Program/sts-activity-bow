<script setup lang="ts">
import type { TeamCreateInput } from "~/server/types/team";
const { useCreateTeam } = useTeam();
const { create, created, loading, error, errorMessage } = useCreateTeam();

const emit = defineEmits<{
  created: [id: number];
}>();
const newTeam = ref<TeamCreateInput>({ name: "" });

async function submitCreate() {
  const reqBody: TeamCreateInput = {
    name: newTeam.value.name,
    flagZoneLat: newTeam.value.flagZoneLat,
    flagZoneLong: newTeam.value.flagZoneLong,
  };
  const teamId = await create(reqBody);

  if (teamId) {
    emit("created", teamId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Create Team</legend>
      <div class="form-row">
        <label for="form-team-create-name">Team name</label>
        <input id="form-team-create-name" v-model="newTeam.name" />
      </div>
      <div class="form-row">
        <label for="form-team-create-lat">Lat</label>
        <input
          type="number"
          id="form-team-create-lat"
          v-model="newTeam.flagZoneLat"
        />
      </div>
      <div class="form-row">
        <label for="form-team-create-long">Long</label>
        <input
          type="number"
          id="form-team-create-long"
          v-model="newTeam.flagZoneLong"
        />
      </div>
      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button
          type="button"
          @click="submitCreate"
          :disabled="loading || created"
        >
          Create Team
        </button>
      </div>
    </fieldset>
  </form>
</template>
