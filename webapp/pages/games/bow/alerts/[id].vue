<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "BowAlert",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/bowAlerts`, label: `BowAlerts` },
    { to: ``, label: `BowAlert` },
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
const { data, refresh, pending } = useFetch(
  `/api/bowAlerts/${route.params.id}`
);

const showBowAlertUpdate = useState("showBowAlertUpdate", () => false);
function bowAlertUpdated(id: number) {
  showBowAlertUpdate.value = false;
  refresh();
}

const showBowAlertDelete = useState("showBowAlertDelete", () => false);
function bowAlertDeleted(id: number) {
  showBowAlertDelete.value = false;
  const router = useRouter();
  router.push(`/bowAlerts`);
}
</script>

<template>
  <div v-if="data && data.success && !pending">
    <h2>BowAlert: {{ data.bowAlert.name }}</h2>
    <button type="button" @click="showBowAlertUpdate = !showBowAlertUpdate">
      {{ showBowAlertUpdate ? "Hide" : "Show" }} Update BowAlert
    </button>
    <BowAlertUpdate
      v-if="showBowAlertUpdate"
      :bowAlert="data.bowAlert"
      @updated="bowAlertUpdated"
    ></BowAlertUpdate>

    <button type="button" @click="showBowAlertDelete = !showBowAlertDelete">
      {{ showBowAlertDelete ? "Hide" : "Show" }} Delete BowAlert
    </button>
    <BowAlertDelete
      v-if="showBowAlertDelete"
      :bowAlert="data.bowAlert"
      @deleted="bowAlertDeleted"
    ></BowAlertDelete>

    <div>ID: {{ data.bowAlert.id }}</div>
    <div>Name: {{ data.bowAlert.name }}</div>
    <div>Lat: {{ data.bowAlert.lat }}</div>
    <div>Long: {{ data.bowAlert.long }}</div>

    <ActionList :bowAlert="data.bowAlert"></ActionList>
    <TrackerLocationList :bowAlert="data.bowAlert"></TrackerLocationList>
  </div>
  <div v-else>loading or error</div>
</template>
