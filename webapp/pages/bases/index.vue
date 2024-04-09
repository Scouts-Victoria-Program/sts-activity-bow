<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Bases",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/bases`, label: `Bases` },
  ]),
});
</script>

<template>
  <div>
    <BaseList> </BaseList>
  </div>
</template>
