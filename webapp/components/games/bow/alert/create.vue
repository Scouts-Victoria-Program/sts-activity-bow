<script setup lang="ts">
import type { BowAlertCreateInput } from "~/server/types/bowAlert";
const { useCreateBowAlert } = useBowAlert();
const { create, created, loading, error, errorMessage } = useCreateBowAlert();

const emit = defineEmits<{
  created: [id: number];
}>();
const newBowAlert = ref<BowAlertCreateInput>({
  datetime: "",
  faction: "",
  expiry: "",
  description: "",
  baseId: 0,
});

async function submitCreate() {
  const reqBody: BowAlertCreateInput = {
    datetime: newBowAlert.value.datetime,
    faction: newBowAlert.value.faction,
    expiry: newBowAlert.value.expiry,
    description: newBowAlert.value.description,
    baseId: newBowAlert.value.baseId,
  };
  const bowAlertId = await create(reqBody);

  if (bowAlertId) {
    emit("created", bowAlertId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Create BowAlert</legend>
      <div class="form-row">
        <label for="form-bowAlert-create-datetime">BowAlert datetime</label>
        <input
          id="form-bowAlert-create-datetime"
          v-model="newBowAlert.datetime"
        />
      </div>
      <div class="form-row">
        <label for="form-bowAlert-create-faction">BowAlert faction</label>
        <input
          id="form-bowAlert-create-faction"
          v-model="newBowAlert.faction"
        />
      </div>
      <div class="form-row">
        <label for="form-bowAlert-create-expiry">BowAlert expiry</label>
        <input id="form-bowAlert-create-expiry" v-model="newBowAlert.expiry" />
      </div>
      <div class="form-row">
        <label for="form-bowAlert-create-description"
          >BowAlert description</label
        >
        <input
          id="form-bowAlert-create-description"
          v-model="newBowAlert.description"
        />
      </div>
      <div class="form-row">
        <label for="form-bowAlert-create-baseId">BowAlert baseId</label>
        <input id="form-bowAlert-create-baseId" v-model="newBowAlert.baseId" />
      </div>
      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button
          type="button"
          @click="submitCreate"
          :disabled="loading || created"
        >
          Create BowAlert
        </button>
      </div>
    </fieldset>
  </form>
</template>
