<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Actions",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/actions`, label: `Actions` },
  ]),
});
</script>

<template>
  <div>
    <ActionList> </ActionList>
  </div>
</template>
