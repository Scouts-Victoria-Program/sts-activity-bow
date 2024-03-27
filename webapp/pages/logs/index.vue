<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Logs",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/logs`, label: `Logs` },
  ]),
});
</script>

<template>
  <div>
    <LogList> </LogList>
  </div>
</template>
