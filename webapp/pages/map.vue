<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Map",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/map`, label: `Map` },
  ]),
});
</script>

<template>
  <div>
    <Map></Map>
  </div>
</template>
