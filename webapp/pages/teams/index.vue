<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Teams",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/teams`, label: `Teams` },
  ]),
});
</script>

<template>
  <div>
    <TeamList> </TeamList>
  </div>
</template>
