<script setup lang="ts">
import type { BaseData, BaseUpdateInput } from "~/server/types/base";
const { useUpdateBase } = useBase();
const { update, loading, error, errorMessage } = useUpdateBase();

const emit = defineEmits<{
  updated: [id: number];
}>();
const props = defineProps<{
  base: BaseData;
}>();

const newBase = ref<BaseUpdateInput>({
  id: props.base.id,
  name: props.base.name,
  lat: props.base.lat,
  long: props.base.long,
});

async function submitUpdate() {
  const reqBody: BaseUpdateInput = {
    id: newBase.value.id,
    name: newBase.value.name,
    lat: newBase.value.lat,
    long: newBase.value.long,
  };

  const baseId = await update(reqBody);

  if (baseId) {
    emit("updated", baseId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Update Base</legend>
      <div>
        <p>ID: {{ newBase.id }}</p>
      </div>
      <div class="form-row">
        <label for="form-base-update-name">Base name</label>
        <input id="form-base-update-name" v-model="newBase.name" />
      </div>
      <div class="form-row">
        <label for="form-base-update-lat">Lat</label>
        <input type="number" id="form-base-update-lat" v-model="newBase.lat" />
      </div>
      <div class="form-row">
        <label for="form-base-update-long">Long</label>
        <input
          type="number"
          id="form-base-update-long"
          v-model="newBase.long"
        />
      </div>
      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button type="button" @click="submitUpdate" :disabled="loading">
          Update Base
        </button>
      </div>
    </fieldset>
  </form>
</template>
