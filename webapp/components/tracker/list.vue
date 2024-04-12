<script setup lang="ts">
const { useListTrackers } = useTracker();
const {
  displayTrackers,
  uiPageControls,
  refresh,
  loading,
  error,
  errorMessage,
} = useListTrackers();

const showTrackerCreate = useState("showTrackerCreate", () => false);
function trackerCreated(newId: number) {
  showTrackerCreate.value = false;
  refresh();
}

const showTrackerBulkCreate = useState("showTrackerBulkCreate", () => false);
function trackerBulkCreated() {
  showTrackerBulkCreate.value = false;
  refresh();
}
</script>

<template>
  <div>
    <h2>Trackers</h2>

    <TrackerCreate
      v-if="showTrackerCreate"
      @created="trackerCreated"
    ></TrackerCreate>
    <TrackerBulkCreate
      v-if="showTrackerBulkCreate"
      @created="trackerBulkCreated"
    ></TrackerBulkCreate>

    <UiListControls>
      <div>
        <button type="button" @click="showTrackerCreate = !showTrackerCreate">
          {{ showTrackerCreate ? "Hide" : "Show" }} Create Tracker
        </button>

        <button
          type="button"
          @click="showTrackerBulkCreate = !showTrackerBulkCreate"
        >
          {{ showTrackerBulkCreate ? "Hide" : "Show" }} Create Bulk Trackers
        </button>
      </div>

      <UiPageControls :controls="uiPageControls"></UiPageControls>

      <div></div>
    </UiListControls>

    <div v-if="error">Unable to load tracker list {{ errorMessage }}</div>
    <TableSkeleton v-else-if="loading" :rows="15" :columns="6"></TableSkeleton>
    <table v-else>
      <thead>
        <tr>
          <th>id</th>
          <th>name</th>
          <th>scoreModifier</th>
          <th>locations</th>
          <th>logs</th>
          <th>actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tracker in displayTrackers" :key="tracker.id">
          <td>{{ tracker.id }}</td>
          <td>{{ tracker.name }}</td>
          <td>x{{ tracker.scoreModifier }}</td>
          <td>
            <NuxtLink :to="`/locations?trackerId=${tracker.id}`">
              view locations
            </NuxtLink>
          </td>
          <td>
            <NuxtLink :to="`/logs?trackerId=${tracker.id}`">view logs</NuxtLink>
          </td>
          <td><NuxtLink :to="`/trackers/${tracker.id}`">show</NuxtLink></td>
        </tr>
      </tbody>
    </table>

    <UiListControls>
      <UiPageControls :controls="uiPageControls"></UiPageControls>
    </UiListControls>
  </div>
</template>
