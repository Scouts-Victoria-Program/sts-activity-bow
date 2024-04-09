<script setup lang="ts">
import { useBreadcrumbs } from "~/types/breadcrumbs";

useHead({
  title: "Dashboard",
});

definePageMeta({
  breadcrumbs: useBreadcrumbs([{ to: `/`, label: `Home` }]),
});
</script>

<template>
  <div>
    <div class="hero">
      <p>Moonee Valley District Scouts presents</p>
      <h2>Capture the Flag: A game of stealth of tactics</h2>
    </div>

    <h3>View the Game Map:</h3>
    <ul>
      <li><NuxtLink :to="`/map`">Map</NuxtLink></li>
    </ul>

    <h3>View the bases playing:</h3>
    <ul>
      <li><NuxtLink :to="`/bases`">Base list</NuxtLink></li>
    </ul>

    <h3>Locate Flags:</h3>
    <ul>
      <li><NuxtLink :to="`/trackers`">Tracker list</NuxtLink></li>
    </ul>

    <h3>Browse the raw log data:</h3>
    <ul>
      <li>
        <NuxtLink :to="`/flags`">
          Flag list (in {{ $config.public.flagWindowIntervalMinutes }} minute
          windows)
        </NuxtLink>
      </li>
      <li><NuxtLink :to="`/logs`">Log list</NuxtLink></li>
    </ul>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hero h2 {
  background-color: #1d483a; /*MVD dark green*/
  box-shadow: 0 0 11px 10px #1d483a; /*MVD dark green*/
  border-radius: 40px;
}
</style>
