<script setup lang="ts">
import type { TeamData } from "~/server/types/team";
import { DateTime } from "luxon";
import type { ActionOptionKeys } from "~/server/types/action";

const props = defineProps<{
  team?: TeamData;
  action?: ActionOptionKeys;
}>();

const { fields, useUiFilterControls } = useListFilters<{
  teamId: Ref<number | undefined>;
  action: Ref<ActionOptionKeys | undefined>;
}>({
  teamId: ref(props.team?.id),
  action: ref(props.action),
});
const uiFilterControls = useUiFilterControls();

const { useListActions } = useAction();
const {
  displayActions,
  uiPageControls,
  refresh,
  loading,
  error,
  errorMessage,
} = useListActions({
  where: {
    teamId: fields.teamId,
    action: fields.action,
  },
});

const showActionCreate = useState("showActionCreate", () => false);
function actionCreated(newId: number) {
  showActionCreate.value = false;
  refresh();
}
</script>

<template>
  <div>
    <h2>Actions</h2>

    <ActionCreate
      v-if="showActionCreate"
      @created="actionCreated"
      :team="props.team"
    ></ActionCreate>

    <UiListControls>
      <div>
        <button type="button" @click="showActionCreate = !showActionCreate">
          {{ showActionCreate ? "Hide" : "Show" }} Create Action
        </button>
      </div>

      <UiPageControls :controls="uiPageControls"></UiPageControls>

      <UiFilterControls :filters="uiFilterControls"></UiFilterControls>
    </UiListControls>

    <div v-if="error">Unable to load action list {{ errorMessage }}</div>
    <TableSkeleton v-else-if="loading" :rows="15" :columns="7"></TableSkeleton>
    <table v-else>
      <thead>
        <tr>
          <th>id</th>
          <th>datetime</th>
          <th>action</th>
          <th>score</th>
          <th>description</th>
          <th>team</th>
          <th>actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="action in displayActions" :key="action.id">
          <td>{{ action.id }}</td>
          <td>
            {{
              DateTime.fromISO(action.datetime).toLocaleString(
                DateTime.DATETIME_SHORT
              )
            }}
          </td>
          <td>{{ action.action }}</td>
          <td>{{ action.score }}</td>
          <td>{{ action.description }}</td>
          <td>
            <NuxtLink :to="`/teams/${action.teamId}`">{{
              action.teamId
            }}</NuxtLink>
          </td>
          <td><NuxtLink :to="`/actions/${action.id}`">show</NuxtLink></td>
        </tr>
      </tbody>
    </table>

    <UiListControls>
      <UiPageControls :controls="uiPageControls"></UiPageControls>
    </UiListControls>
  </div>
</template>
