<script setup lang="ts">
import type { BaseData } from "~/server/types/base";
import type { TrackerData } from "~/server/types/tracker";
import { DateTime } from "luxon";

const props = defineProps<{
  base?: BaseData;
  tracker?: TrackerData;
}>();

const { fields, useUiFilterControls } = useListFilters<{
  baseId: Ref<number | undefined>;
  trackerId: Ref<number | undefined>;
}>({
  baseId: ref(props.base?.id),
  trackerId: ref(props.tracker?.id),
});
const uiFilterControls = useUiFilterControls();

const { useListTrackerLocations } = useTrackerLocation();
const {
  displayTrackerLocations,
  uiPageControls,
  refresh,
  loading,
  error,
  errorMessage,
} = useListTrackerLocations({
  where: {
    baseId: fields.baseId,
    trackerId: fields.trackerId,
  },
});

const showTrackerLocationCreate = useState(
  "showTrackerLocationCreate",
  () => false
);
function trackerLocationCreated(newId: number) {
  showTrackerLocationCreate.value = false;
  refresh();
}
</script>

<template>
  <div>
    <h2>TrackerLocations</h2>

    <TrackerLocationCreate
      v-if="showTrackerLocationCreate"
      @created="trackerLocationCreated"
      :tracker="props.tracker"
      :base="props.base"
    ></TrackerLocationCreate>

    <UiListControls>
      <div>
        <button
          type="button"
          @click="showTrackerLocationCreate = !showTrackerLocationCreate"
        >
          {{ showTrackerLocationCreate ? "Hide" : "Show" }} Create
          TrackerLocation
        </button>
      </div>

      <UiPageControls :controls="uiPageControls"></UiPageControls>

      <UiFilterControls :filters="uiFilterControls"></UiFilterControls>
    </UiListControls>

    <div v-if="error">
      Unable to load trackerLocation list {{ errorMessage }}
    </div>
    <TableSkeleton v-else-if="loading" :rows="15" :columns="10"></TableSkeleton>
    <table v-else>
      <thead>
        <tr>
          <th>id</th>
          <th>datetime</th>
          <th>windowSize</th>
          <th>scoreModifier</th>
          <th>lat</th>
          <th>long</th>
          <th>tracker</th>
          <th>base</th>
          <th>distance</th>
          <th>actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="trackerLocation in displayTrackerLocations"
          :key="trackerLocation.id"
        >
          <td>{{ trackerLocation.id }}</td>
          <td>
            {{
              DateTime.fromISO(trackerLocation.datetime).toLocaleString(
                DateTime.DATETIME_SHORT
              )
            }}
          </td>
          <td>{{ trackerLocation.windowSize }}</td>
          <td>{{ trackerLocation.scoreModifier }}</td>
          <td>{{ trackerLocation.lat }}</td>
          <td>{{ trackerLocation.long }}</td>
          <td>
            <NuxtLink :to="`/trackers/${trackerLocation.trackerId}`">{{
              trackerLocation.trackerId
            }}</NuxtLink>
          </td>
          <td>
            <NuxtLink :to="`/bases/${trackerLocation.baseId}`">{{
              trackerLocation.baseId
            }}</NuxtLink>
          </td>
          <td>{{ trackerLocation.distance }}</td>
          <td>
            <NuxtLink :to="`/locations/${trackerLocation.id}`">show</NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>

    <UiListControls>
      <UiPageControls :controls="uiPageControls"></UiPageControls>
    </UiListControls>
  </div>
</template>
