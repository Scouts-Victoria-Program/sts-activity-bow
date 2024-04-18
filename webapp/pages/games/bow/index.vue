<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Games",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([
    { to: `/`, label: `Home` },
    { to: `/games`, label: `Games` },
    { to: `/games/bow/`, label: `BOW` },
  ]),
});
</script>

<template>
  <div>
    <NuxtLink
      :to="{
        path: `/games/bow/play`,
        query: {
          faction: 'Federation',
        },
      }"
    >
      Play Federation
    </NuxtLink>
    <br />
    <NuxtLink :to="`/games/bow/play?faction=Borg`"> Play Borg </NuxtLink>
    <br />
    <NuxtLink :to="`/games/bow/play?faction=Romulan`"> Play Romulan </NuxtLink>
  </div>
</template>
