<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Games",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/games`, label: `Games` },
  ]),
});
</script>

<template>
  <div>
    <NuxtLink :to="`/games/bow`">BOW</NuxtLink>
  </div>
</template>
