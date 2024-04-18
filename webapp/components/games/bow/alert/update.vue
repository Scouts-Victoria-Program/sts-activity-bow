<script setup lang="ts">
import type {
  BowAlertData,
  BowAlertUpdateInput,
} from "~/server/types/bowAlert";
const { useUpdateBowAlert } = useBowAlert();
const { update, loading, error, errorMessage } = useUpdateBowAlert();

const emit = defineEmits<{
  updated: [id: number];
}>();
const props = defineProps<{
  bowAlert: BowAlertData;
}>();

const newBowAlert = ref<BowAlertUpdateInput>({
  id: props.bowAlert.id,
  datetime: props.bowAlert.datetime,
  faction: props.bowAlert.faction,
  expiry: props.bowAlert.expiry,
  description: props.bowAlert.description,
  baseId: props.bowAlert.baseId,
});

async function submitUpdate() {
  const reqBody: BowAlertUpdateInput = {
    id: newBowAlert.value.id,
    datetime: newBowAlert.value.datetime,
    faction: newBowAlert.value.faction,
    expiry: newBowAlert.value.expiry,
    description: newBowAlert.value.description,
    baseId: newBowAlert.value.baseId,
  };

  const bowAlertId = await update(reqBody);

  if (bowAlertId) {
    emit("updated", bowAlertId);
  }
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Update BowAlert</legend>
      <div>
        <p>ID: {{ newBowAlert.id }}</p>
      </div>
      <div class="form-row">
        <label for="form-bowAlert-update-datetime">BowAlert datetime</label>
        <input
          id="form-bowAlert-update-datetime"
          v-model="newBowAlert.datetime"
        />
      </div>
      <div class="form-row">
        <label for="form-bowAlert-update-faction">BowAlert faction</label>
        <input
          id="form-bowAlert-update-faction"
          v-model="newBowAlert.faction"
        />
      </div>
      <div class="form-row">
        <label for="form-bowAlert-update-expiry">BowAlert expiry</label>
        <input id="form-bowAlert-update-expiry" v-model="newBowAlert.expiry" />
      </div>
      <div class="form-row">
        <label for="form-bowAlert-update-description"
          >BowAlert description</label
        >
        <input
          id="form-bowAlert-update-description"
          v-model="newBowAlert.description"
        />
      </div>
      <div class="form-row">
        <label for="form-bowAlert-update-baseId">BowAlert baseId</label>
        <input id="form-bowAlert-update-baseId" v-model="newBowAlert.baseId" />
      </div>

      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button type="button" @click="submitUpdate" :disabled="loading">
          Update BowAlert
        </button>
      </div>
    </fieldset>
  </form>
</template>
