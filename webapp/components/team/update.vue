<script setup lang="ts">
import type { TeamData, TeamUpdateInput } from "~/server/types/team";
const { useUpdateTeam } = useTeam();
const { update, loading, error, errorMessage } = useUpdateTeam();

const emit = defineEmits<{
  updated: [id: number];
}>();
const props = defineProps<{
  team: TeamData;
}>();

const newTeam = ref<TeamUpdateInput>({
  id: props.team.id,
  name: props.team.name,
  flagZoneLat: props.team.flagZoneLat,
  flagZoneLong: props.team.flagZoneLong,
});

async function submitUpdate() {
  const reqBody: TeamUpdateInput = {
    id: newTeam.value.id,
    name: newTeam.value.name,
    flagZoneLat: newTeam.value.flagZoneLat,
    flagZoneLong: newTeam.value.flagZoneLong,
  };

  const teamId = await update(reqBody);

  if (teamId) {
    emit("updated", teamId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Update Team</legend>
      <div>
        <p>ID: {{ newTeam.id }}</p>
      </div>
      <div class="form-row">
        <label for="form-team-update-name">Team name</label>
        <input id="form-team-update-name" v-model="newTeam.name" />
      </div>
      <div class="form-row">
        <label for="form-team-update-lat">Lat</label>
        <input
          type="number"
          id="form-team-update-lat"
          v-model="newTeam.flagZoneLat"
        />
      </div>
      <div class="form-row">
        <label for="form-team-update-long">Long</label>
        <input
          type="number"
          id="form-team-update-long"
          v-model="newTeam.flagZoneLong"
        />
      </div>
      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button type="button" @click="submitUpdate" :disabled="loading">
          Update Team
        </button>
      </div>
    </fieldset>
  </form>
</template>
