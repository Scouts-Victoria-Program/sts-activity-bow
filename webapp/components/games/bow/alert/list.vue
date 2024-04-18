<script setup lang="ts">
import { DateTime } from "luxon";

const { useListBowAlerts } = useBowAlert();
const {
  displayBowAlerts,
  uiPageControls,
  refresh,
  loading,
  error,
  errorMessage,
} = useListBowAlerts();

const showBowAlertCreate = useState("showBowAlertCreate", () => false);
function bowAlertCreated(newId: number) {
  showBowAlertCreate.value = false;
  refresh();
}

const showBowAlertBulkCreate = useState("showBowAlertBulkCreate", () => false);
function bowAlertBulkCreated() {
  showBowAlertBulkCreate.value = false;
  refresh();
}
</script>

<template>
  <div>
    <h2>BowAlerts</h2>

    <GamesBowAlertCreate
      v-if="showBowAlertCreate"
      @created="bowAlertCreated"
    ></GamesBowAlertCreate>
    <GamesBowAlertBulkCreate
      v-if="showBowAlertBulkCreate"
      @created="bowAlertBulkCreated"
    ></GamesBowAlertBulkCreate>

    <UiListControls>
      <div>
        <button type="button" @click="showBowAlertCreate = !showBowAlertCreate">
          {{ showBowAlertCreate ? "Hide" : "Show" }} Create BowAlert
        </button>

        <button
          type="button"
          @click="showBowAlertBulkCreate = !showBowAlertBulkCreate"
        >
          {{ showBowAlertBulkCreate ? "Hide" : "Show" }} Create Bulk BowAlerts
        </button>
      </div>

      <UiPageControls :controls="uiPageControls"></UiPageControls>

      <div></div>
    </UiListControls>

    <div v-if="error">Unable to load bowAlert list {{ errorMessage }}</div>
    <TableSkeleton v-else-if="loading" :rows="15" :columns="7"></TableSkeleton>
    <table v-else>
      <thead>
        <tr>
          <th>id</th>
          <th>datetime</th>
          <th>faction</th>
          <th>expiry</th>
          <th>duration</th>
          <th>description</th>
          <th>base</th>
          <th>actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="bowAlert in displayBowAlerts" :key="bowAlert.id">
          <td>{{ bowAlert.id }}</td>
          <td>{{ bowAlert.datetime }}</td>
          <td>{{ bowAlert.faction }}</td>
          <td>{{ bowAlert.expiry }}</td>
          <td>
            {{
              DateTime.fromISO(bowAlert.datetime).diff(
                DateTime.fromISO(bowAlert.expiry)
              )
            }}
          </td>
          <td>{{ bowAlert.description }}</td>
          <td>{{ bowAlert.baseId }}</td>
          <td>
            <NuxtLink :to="`/locations?bowAlertId=${bowAlert.id}`"
              >view locations</NuxtLink
            >
          </td>
          <td>
            <NuxtLink :to="`/logs?bowAlertId=${bowAlert.id}`"
              >view logs</NuxtLink
            >
          </td>
          <td><NuxtLink :to="`/bowAlerts/${bowAlert.id}`">show</NuxtLink></td>
        </tr>
      </tbody>
    </table>

    <UiListControls>
      <UiPageControls :controls="uiPageControls"></UiPageControls>
    </UiListControls>
  </div>
</template>
