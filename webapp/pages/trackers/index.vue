<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Trackers",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/trackers`, label: `Trackers` },
  ]),
});
</script>

<template>
  <div>
    <TrackerList> </TrackerList>
  </div>
</template>
