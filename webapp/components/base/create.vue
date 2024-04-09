<script setup lang="ts">
import type { BaseCreateInput } from "~/server/types/base";
const { useCreateBase } = useBase();
const { create, created, loading, error, errorMessage } = useCreateBase();

const emit = defineEmits<{
  created: [id: number];
}>();
const newBase = ref<BaseCreateInput>({ name: "" });

async function submitCreate() {
  const reqBody: BaseCreateInput = {
    name: newBase.value.name,
    trackerlocationZoneLat: newBase.value.trackerlocationZoneLat,
    trackerlocationZoneLong: newBase.value.trackerlocationZoneLong,
  };
  const baseId = await create(reqBody);

  if (baseId) {
    emit("created", baseId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Create Base</legend>
      <div class="form-row">
        <label for="form-base-create-name">Base name</label>
        <input id="form-base-create-name" v-model="newBase.name" />
      </div>
      <div class="form-row">
        <label for="form-base-create-lat">Lat</label>
        <input
          type="number"
          id="form-base-create-lat"
          v-model="newBase.trackerlocationZoneLat"
        />
      </div>
      <div class="form-row">
        <label for="form-base-create-long">Long</label>
        <input
          type="number"
          id="form-base-create-long"
          v-model="newBase.trackerlocationZoneLong"
        />
      </div>
      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button
          type="button"
          @click="submitCreate"
          :disabled="loading || created"
        >
          Create Base
        </button>
      </div>
    </fieldset>
  </form>
</template>
