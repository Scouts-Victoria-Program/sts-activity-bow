<script setup lang="ts">
const { useListBases } = useBase();
const { displayBases, uiPageControls, refresh, loading, error, errorMessage } =
  useListBases();

const showBaseCreate = useState("showBaseCreate", () => false);
function baseCreated(newId: number) {
  showBaseCreate.value = false;
  refresh();
}

const showBaseBulkCreate = useState("showBaseBulkCreate", () => false);
function baseBulkCreated() {
  showBaseBulkCreate.value = false;
  refresh();
}
</script>

<template>
  <div>
    <h2>Bases</h2>

    <BaseCreate v-if="showBaseCreate" @created="baseCreated"></BaseCreate>
    <BaseBulkCreate
      v-if="showBaseBulkCreate"
      @created="baseBulkCreated"
    ></BaseBulkCreate>

    <UiListControls>
      <div>
        <button type="button" @click="showBaseCreate = !showBaseCreate">
          {{ showBaseCreate ? "Hide" : "Show" }} Create Base
        </button>

        <button type="button" @click="showBaseBulkCreate = !showBaseBulkCreate">
          {{ showBaseBulkCreate ? "Hide" : "Show" }} Create Bulk Bases
        </button>
      </div>

      <UiPageControls :controls="uiPageControls"></UiPageControls>

      <div></div>
    </UiListControls>

    <div v-if="error">Unable to load base list {{ errorMessage }}</div>
    <TableSkeleton v-else-if="loading" :rows="15" :columns="7"></TableSkeleton>
    <table v-else>
      <thead>
        <tr>
          <th>id</th>
          <th>name</th>
          <th>lat</th>
          <th>long</th>
          <th>locations</th>
          <th>logs</th>
          <th>actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="base in displayBases" :key="base.id">
          <td>{{ base.id }}</td>
          <td>{{ base.name }}</td>
          <td>{{ base.lat }}</td>
          <td>{{ base.long }}</td>
          <td>
            <NuxtLink :to="`/locations?baseId=${base.id}`"
              >view locations</NuxtLink
            >
          </td>
          <td>
            <NuxtLink :to="`/logs?baseId=${base.id}`">view logs</NuxtLink>
          </td>
          <td><NuxtLink :to="`/bases/${base.id}`">show</NuxtLink></td>
        </tr>
      </tbody>
    </table>

    <UiListControls>
      <UiPageControls :controls="uiPageControls"></UiPageControls>
    </UiListControls>
  </div>
</template>
