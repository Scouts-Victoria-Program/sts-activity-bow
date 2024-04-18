<script setup lang="ts">
import type { BowAlertCreateInput } from "~/server/types/bowAlert";
const { useCreateBowAlert } = useBowAlert();
const { create, created, loading, error, errorMessage } = useCreateBowAlert();

const emit = defineEmits<{
  created: [];
}>();
const bulkField = ref<string>("");

const parsedBowAlertData = computed((): BowAlertCreateInput[] => {
  const trimmed = bulkField.value.trim();

  if (trimmed === "") {
    return [];
  }

  const rows = trimmed.split("\n").filter((row) => row.trim() !== "");

  const newBowAlerts: BowAlertCreateInput[] = rows.map(
    (row): BowAlertCreateInput => {
      const values = row.split(",");

      return {
        datetime: values[0]?.trim(),
        faction: values[1]?.trim(),
        expiry: values[2]?.trim(),
        description: values[3]?.trim(),
        baseId: Number(values[4]?.trim() ?? 0),
      };
    }
  );

  return newBowAlerts;
});

const requestStatus = ref<Record<string, string>>({});
function getStatus(index: number): string {
  return requestStatus.value[String(index)] ?? "";
}

async function submitBulkCreate() {
  for (const index in parsedBowAlertData.value) {
    const newBowAlert = parsedBowAlertData.value[index];

    requestStatus.value[index] = `Creating`;
    const bowAlertId = await create(newBowAlert);
    requestStatus.value[index] = `Created ${bowAlertId}`;
  }

  emit("created");
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Create BowAlert</legend>
      <div class="form-row">
        <label for="form-bowAlert-create">Bulk Create</label>
        <textarea
          id="form-bowAlert-create"
          v-model="bulkField"
          placeholder="datetime,faction,expiry,description,base"
        ></textarea>
      </div>
      <table>
        <thead>
          <tr>
            <th>datetime</th>
            <th>faction</th>
            <th>expiry</th>
            <th>description</th>
            <th>base</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(bowAlert, index) in parsedBowAlertData" :key="index">
            <td>{{ bowAlert.datetime }}</td>
            <td>{{ bowAlert.faction }}</td>
            <td>{{ bowAlert.expiry }}</td>
            <td>{{ bowAlert.description }}</td>
            <td>{{ bowAlert.baseId }}</td>
            <td>{{ getStatus(index) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="error">{{ errorMessage }}</div>
      <div class="form-actions">
        <button
          type="button"
          @click="submitBulkCreate"
          :disabled="loading || created"
        >
          Create BowAlerts
        </button>
      </div>
    </fieldset>
  </form>
</template>
