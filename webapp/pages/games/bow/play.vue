<script setup lang="ts">
import type { locObj2Ary } from "~/composables/map";
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "BOW",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/games/`, label: `games` },
    { to: `/games/bow/`, label: `BOW` },
  ]),
});

const { useListAllBases, bases } = useBase();
const {
  pending: basePending,
  error: baseError,
  errorMessage: baseErrorMessage,
} = useListAllBases();

const route = useRoute();
const factionQuery = Array.isArray(route.query.faction)
  ? route.query.faction[0]
  : route.query.faction;

const faction = ref(factionQuery ?? "");

const location = { lat: -37.06484464931182, long: 145.50394461024595 };
</script>

<template>
  <div>
    <div v-if="!faction">
      No faction specified<br />

      <select v-model="faction">
        <option value="Federation">Federation</option>
        <option value="Borg">Borg</option>
        <option value="Romulan">Romulan</option>
      </select>
    </div>

    <Map v-else>
      <ol-overlay :position="locObj2Ary(location)" positioning="center-center">
        <GamesBowAlerts :faction="faction" style="width: 25vw"></GamesBowAlerts>
      </ol-overlay>
    </Map>
  </div>
</template>
