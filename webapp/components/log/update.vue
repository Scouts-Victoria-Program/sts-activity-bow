<script setup lang="ts">
import type { LogData, LogUpdateInput } from "~/server/types/log";
const { useUpdateLog } = useLog();
const { update, loading, error, errorMessage } = useUpdateLog();

const emit = defineEmits<{
  updated: [id: number];
}>();
const props = defineProps<{
  log: LogData;
}>();

const newLog = ref<LogUpdateInput>({
  id: props.log.id,
  datetime: props.log.datetime,
  lat: props.log.lat,
  long: props.log.long,
  trackerId: props.log.trackerId,
  baseId: props.log.baseId ?? null,
  distance: props.log.distance,
});

async function submitUpdate() {
  const reqBody: LogUpdateInput = {
    id: newLog.value.id,
    datetime: newLog.value.datetime,
    lat: newLog.value.lat,
    long: newLog.value.long,
    trackerId: newLog.value.trackerId,
    baseId: newLog.value.baseId,
    distance: newLog.value.distance,
  };
  const logId = await update(reqBody);

  if (logId) {
    emit("updated", logId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Update Log</legend>
      <div>
        <p>ID: {{ newLog.id }}</p>
      </div>
      <div class="form-row">
        <label for="form-log-create-datetime">Datetime</label>
        <input id="form-log-create-datetime" v-model="newLog.datetime" />
      </div>
      <div class="form-row">
        <label for="form-log-create-lat">Lat</label>
        <input type="number" id="form-log-create-lat" v-model="newLog.lat" />
      </div>
      <div class="form-row">
        <label for="form-log-create-long">Long</label>
        <input type="number" id="form-log-create-long" v-model="newLog.long" />
      </div>
      <div class="form-row">
        <label for="form-log-create-tracker">Tracker</label>
        <input id="form-log-create-tracker" v-model="newLog.trackerId" />
      </div>
      <div class="form-row">
        <label for="form-log-create-base">Base</label>
        <input id="form-log-create-base" v-model="newLog.baseId" />
      </div>
      <div class="form-row">
        <label for="form-log-create-distance">Distance</label>
        <input
          type="number"
          id="form-log-create-distance"
          v-model="newLog.distance"
        />
      </div>
      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button type="button" @click="submitUpdate" :disabled="loading">
          Update Log
        </button>
      </div>
    </fieldset>
  </form>
</template>
