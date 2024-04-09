<script setup lang="ts">
import type { LogCreateInput } from "~/server/types/log";
import type { BaseData } from "~/server/types/base";
import type { TrackerData } from "~/server/types/tracker";

const props = defineProps<{
  base?: BaseData;
  tracker?: TrackerData;
}>();

const { useCreateLog } = useLog();
const { create, created, loading, error, errorMessage } = useCreateLog();

const emit = defineEmits<{
  created: [id: number];
}>();
const newLog = ref<LogCreateInput>({
  datetime: new Date().toISOString(),
  lat: 0,
  long: 0,
  trackerId: props.tracker?.id ?? 0,
  baseId: props.base?.id ?? 0,
  distance: 0,
});

async function submitCreate() {
  const reqBody: LogCreateInput = {
    datetime: newLog.value.datetime,
    lat: newLog.value.lat,
    long: newLog.value.long,
    trackerId: newLog.value.trackerId,
    baseId: newLog.value.baseId,
    distance: newLog.value.distance,
  };
  const logId = await create(reqBody);

  if (logId) {
    emit("created", logId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Create Log</legend>
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
        <button
          type="button"
          @click="submitCreate"
          :disabled="loading || created"
        >
          Create Log
        </button>
      </div>
    </fieldset>
  </form>
</template>
