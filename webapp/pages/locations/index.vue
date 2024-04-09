<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "TrackerLocations",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/locations`, label: `TrackerLocations` },
  ]),
});
</script>

<template>
  <div>
    <TrackerLocationList> </TrackerLocationList>
  </div>
</template>
