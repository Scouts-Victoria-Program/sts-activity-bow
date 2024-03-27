<script setup lang="ts">
import type { TeamData } from "~/server/types/team";
import type { TrackerData } from "~/server/types/tracker";
import { DateTime } from "luxon";

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

const { useListFlags } = useFlag();
const { displayFlags, uiPageControls, refresh, loading, error, errorMessage } =
  useListFlags({
    where: {
      teamId: fields.teamId,
      trackerId: fields.trackerId,
    },
  });

const showFlagCreate = useState("showFlagCreate", () => false);
function flagCreated(newId: number) {
  showFlagCreate.value = false;
  refresh();
}
</script>

<template>
  <div>
    <h2>Flags</h2>

    <FlagCreate
      v-if="showFlagCreate"
      @created="flagCreated"
      :tracker="props.tracker"
      :team="props.team"
    ></FlagCreate>

    <UiListControls>
      <div>
        <button type="button" @click="showFlagCreate = !showFlagCreate">
          {{ showFlagCreate ? "Hide" : "Show" }} Create Flag
        </button>
      </div>

      <UiPageControls :controls="uiPageControls"></UiPageControls>

      <UiFilterControls :filters="uiFilterControls"></UiFilterControls>
    </UiListControls>

    <div v-if="error">Unable to load flag list {{ errorMessage }}</div>
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
          <th>team</th>
          <th>distance</th>
          <th>actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="flag in displayFlags" :key="flag.id">
          <td>{{ flag.id }}</td>
          <td>
            {{
              DateTime.fromISO(flag.datetime).toLocaleString(
                DateTime.DATETIME_SHORT
              )
            }}
          </td>
          <td>{{ flag.windowSize }}</td>
          <td>{{ flag.scoreModifier }}</td>
          <td>{{ flag.lat }}</td>
          <td>{{ flag.long }}</td>
          <td>
            <NuxtLink :to="`/trackers/${flag.trackerId}`">{{
              flag.trackerId
            }}</NuxtLink>
          </td>
          <td>
            <NuxtLink :to="`/teams/${flag.teamId}`">{{ flag.teamId }}</NuxtLink>
          </td>
          <td>{{ flag.distance }}</td>
          <td><NuxtLink :to="`/flags/${flag.id}`">show</NuxtLink></td>
        </tr>
      </tbody>
    </table>

    <UiListControls>
      <UiPageControls :controls="uiPageControls"></UiPageControls>
    </UiListControls>
  </div>
</template>
