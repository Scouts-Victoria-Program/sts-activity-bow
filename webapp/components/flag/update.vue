<script setup lang="ts">
import type { FlagData, FlagUpdateInput } from "~/server/types/flag";
const { useUpdateFlag } = useFlag();
const { update, loading, error, errorMessage } = useUpdateFlag();

const emit = defineEmits<{
  updated: [id: number];
}>();
const props = defineProps<{
  flag: FlagData;
}>();

const newFlag = ref<FlagUpdateInput>({
  id: props.flag.id,
  datetime: props.flag.datetime,
  windowSize: props.flag.windowSize,
  scoreModifier: props.flag.scoreModifier,
  lat: props.flag.lat,
  long: props.flag.long,
  trackerId: props.flag.trackerId,
  teamId: props.flag.teamId,
  distance: props.flag.distance,
});

async function submitUpdate() {
  const reqBody: FlagUpdateInput = {
    id: newFlag.value.id,
    datetime: newFlag.value.datetime,
    windowSize: newFlag.value.windowSize,
    scoreModifier: newFlag.value.scoreModifier,
    lat: newFlag.value.lat,
    long: newFlag.value.long,
    trackerId: newFlag.value.trackerId,
    teamId: newFlag.value.teamId,
    distance: newFlag.value.distance,
  };

  const flagId = await update(reqBody);

  if (flagId) {
    emit("updated", flagId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Update Flag</legend>
      <div>
        <p>ID: {{ newFlag.id }}</p>
      </div>
      <div class="form-row">
        <label for="form-flag-update-window-size">windowSize</label>
        <input
          type="number"
          id="form-flag-update-window-size"
          v-model="newFlag.windowSize"
        />
      </div>
      <div class="form-row">
        <label for="form-flag-update-score-modifier">scoreModifier</label>
        <input
          type="number"
          id="form-flag-update-score-modifier"
          v-model="newFlag.scoreModifier"
        />
      </div>
      <div class="form-row">
        <label for="form-log-create-lat">Lat</label>
        <input type="number" id="form-log-create-lat" v-model="newFlag.lat" />
      </div>
      <div class="form-row">
        <label for="form-log-create-long">Long</label>
        <input type="number" id="form-log-create-long" v-model="newFlag.long" />
      </div>
      <div class="form-row">
        <label for="form-log-create-tracker">Tracker</label>
        <input id="form-log-create-tracker" v-model="newFlag.trackerId" />
      </div>
      <div class="form-row">
        <label for="form-log-create-team">Team</label>
        <input id="form-log-create-team" v-model="newFlag.teamId" />
      </div>
      <div class="form-row">
        <label for="form-log-create-distance">Distance</label>
        <input
          type="number"
          id="form-log-create-distance"
          v-model="newFlag.distance"
        />
      </div>
      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button type="button" @click="submitUpdate" :disabled="loading">
          Update Flag
        </button>
      </div>
    </fieldset>
  </form>
</template>
