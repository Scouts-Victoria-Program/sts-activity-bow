<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";
import { DateTime } from "luxon";

useHead({
  title: "Action",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/actions`, label: `Actions` },
    { to: ``, label: `Action` },
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
const { data, refresh, pending } = useFetch(`/api/actions/${route.params.id}`);

const showActionUpdate = useState("showActionUpdate", () => false);
function actionUpdated(id: number) {
  showActionUpdate.value = false;
  refresh();
}

const showActionDelete = useState("showActionDelete", () => false);
function actionDeleted(id: number) {
  showActionDelete.value = false;
  const router = useRouter();
  router.push(`/actions`);
}
</script>

<template>
  <div v-if="data && data.success && !pending">
    <h2>Action: {{ data.action.baseId }}</h2>
    <button type="button" @click="showActionUpdate = !showActionUpdate">
      {{ showActionUpdate ? "Hide" : "Show" }} Update Action
    </button>
    <ActionUpdate
      v-if="showActionUpdate"
      :action="data.action"
      @updated="actionUpdated"
    ></ActionUpdate>

    <button type="button" @click="showActionDelete = !showActionDelete">
      {{ showActionDelete ? "Hide" : "Show" }} Delete Action
    </button>
    <ActionDelete
      v-if="showActionDelete"
      :action="data.action"
      @deleted="actionDeleted"
    ></ActionDelete>

    <div>ID: {{ data.action.id }}</div>
    <div>
      Datetime:
      {{
        DateTime.fromISO(data.action.datetime).toLocaleString(
          DateTime.DATETIME_SHORT
        )
      }}
    </div>
    <div>Action: {{ data.action.action }}</div>
    <div>Score {{ data.action.score }}</div>
    <div>Description {{ data.action.description }}</div>
    <div>BaseId: {{ data.action.baseId }}</div>
  </div>
  <div v-else>loading or error</div>
</template>
