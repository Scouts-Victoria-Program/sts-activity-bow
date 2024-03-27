<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Flags",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/flags`, label: `Flags` },
  ]),
});
</script>

<template>
  <div>
    <FlagList> </FlagList>
  </div>
</template>
