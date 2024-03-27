<script setup lang="ts">
import type { TeamData } from "~/server/types/team";
import type { TrackerData } from "~/server/types/tracker";

const props = defineProps<{
  team?: TeamData;
  tracker?: TrackerData;
}>();

const { fields, useUiFilterControls } = useListFilters<{
  teamId: Ref<number | undefined>;
  trackerId: Ref<number | undefined>;
}>({
  teamId: ref(props.team?.id),
  trackerId: ref(props.tracker?.id),
});
const uiFilterControls = useUiFilterControls();

const { useListLogs } = useLog();
const { displayLogs, uiPageControls, refresh, loading, error, errorMessage } =
  useListLogs({
    where: {
      teamId: fields.teamId,
      trackerId: fields.trackerId,
    },
  });

const showLogCreate = useState("showLogCreate", () => false);
function logCreated(newId: number) {
  showLogCreate.value = false;
  refresh();
}
</script>

<template>
  <div>
    <h2>Logs</h2>

    <LogCreate
      v-if="showLogCreate"
      @created="logCreated"
      :tracker="props.tracker"
      :team="props.team"
    ></LogCreate>

    <UiListControls>
      <div>
        <button type="button" @click="showLogCreate = !showLogCreate">
          {{ showLogCreate ? "Hide" : "Show" }} Create Log
        </button>
      </div>

      <UiPageControls :controls="uiPageControls"></UiPageControls>

      <UiFilterControls :filters="uiFilterControls"></UiFilterControls>
    </UiListControls>

    <div v-if="error">Unable to load log list {{ errorMessage }}</div>
    <TableSkeleton v-else-if="loading" :rows="15" :columns="8"></TableSkeleton>
    <table v-else>
      <thead>
        <tr>
          <th>id</th>
          <th>datetime</th>
          <th>lat</th>
          <th>long</th>
          <th>tracker</th>
          <th>team</th>
          <th>distance</th>
          <th>actions</th>
        </tr>
      </thead>
      <tbody>
        <LogRow v-for="log in displayLogs" :key="log.id" :log="log"> </LogRow>
      </tbody>
    </table>

    <UiListControls>
      <UiPageControls :controls="uiPageControls"></UiPageControls>
    </UiListControls>
  </div>
</template>
