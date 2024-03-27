<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Stats",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/stats`, label: `Stats` },
  ]),
});
</script>

<template>
  <div>
    <StatList></StatList>
  </div>
</template>
