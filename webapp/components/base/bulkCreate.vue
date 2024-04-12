<script setup lang="ts">
import type { BaseCreateInput } from "~/server/types/base";
const { useCreateBase } = useBase();
const { create, created, loading, error, errorMessage } = useCreateBase();

const emit = defineEmits<{
  created: [];
}>();
const bulkField = ref<string>("");

const parsedBaseData = computed((): BaseCreateInput[] => {
  const trimmed = bulkField.value.trim();

  if (trimmed === "") {
    return [];
  }

  const rows = trimmed.split("\n");

  const newBases: BaseCreateInput[] = rows.map((row): BaseCreateInput => {
    const values = row.split(",");

    return {
      name: values[0].trim(),
      lat: Number(values[1]?.trim() ?? 0),
      long: Number(values[2]?.trim() ?? 0),
    };
  });

  return newBases;
});

const requestStatus = ref<Record<string, string>>({});
function getStatus(index: number): string {
  return requestStatus.value[String(index)] ?? "";
}

async function submitBulkCreate() {
  for (const index in parsedBaseData.value) {
    const newBase = parsedBaseData.value[index];

    requestStatus.value[index] = `Creating`;
    const baseId = await create(newBase);
    requestStatus.value[index] = `Created ${baseId}`;
  }

  emit("created");
}
</script>

<template>
  <form>
    <fieldset>
      <legend>Create Base</legend>
      <div class="form-row">
        <label for="form-base-create">Bulk Create</label>
        <textarea
          id="form-base-create"
          v-model="bulkField"
          placeholder="name,lat,long"
        ></textarea>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Lat</th>
            <th>Long</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(base, index) in parsedBaseData" :key="index">
            <td>{{ base.name }}</td>
            <td>{{ base.lat }}</td>
            <td>{{ base.long }}</td>
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
          Create Bases
        </button>
      </div>
    </fieldset>
  </form>
</template>
