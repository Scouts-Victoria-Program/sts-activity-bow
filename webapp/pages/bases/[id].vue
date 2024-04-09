<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Base",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/bases`, label: `Bases` },
    { to: ``, label: `Base` },
  ]),

  validate: async (route) => {
    if (Array.isArray(route.params.id)) {
      return false;
    }

    // Check if the id is made up of digits
    return /^\d+$/.test(route.params.id);
  },
});
const route = useRoute();
const { data, refresh, pending } = useFetch(`/api/bases/${route.params.id}`);

const showBaseUpdate = useState("showBaseUpdate", () => false);
function baseUpdated(id: number) {
  showBaseUpdate.value = false;
  refresh();
}

const showBaseDelete = useState("showBaseDelete", () => false);
function baseDeleted(id: number) {
  showBaseDelete.value = false;
  const router = useRouter();
  router.push(`/bases`);
}
</script>

<template>
  <div v-if="data && data.success && !pending">
    <h2>Base: {{ data.base.name }}</h2>
    <button type="button" @click="showBaseUpdate = !showBaseUpdate">
      {{ showBaseUpdate ? "Hide" : "Show" }} Update Base
    </button>
    <BaseUpdate
      v-if="showBaseUpdate"
      :base="data.base"
      @updated="baseUpdated"
    ></BaseUpdate>

    <button type="button" @click="showBaseDelete = !showBaseDelete">
      {{ showBaseDelete ? "Hide" : "Show" }} Delete Base
    </button>
    <BaseDelete
      v-if="showBaseDelete"
      :base="data.base"
      @deleted="baseDeleted"
    ></BaseDelete>

    <div>ID: {{ data.base.id }}</div>
    <div>Name: {{ data.base.name }}</div>
    <div>Lat: {{ data.base.lat }}</div>
    <div>Long: {{ data.base.long }}</div>

    <ActionList :base="data.base"></ActionList>
    <TrackerLocationList :base="data.base"></TrackerLocationList>
  </div>
  <div v-else>loading or error</div>
</template>
