<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "BowAlerts",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/bowAlerts`, label: `BowAlerts` },
  ]),
});
</script>

<template>
  <div>
    <GamesBowAlertList></GamesBowAlertList>
  </div>
</template>
