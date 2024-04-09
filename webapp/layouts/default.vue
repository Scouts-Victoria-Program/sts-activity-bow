<script setup lang="ts">
import type { Breadcrumb } from "~/types/breadcrumbs";
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - LoRa Trackers` : "LoRa Trackers";
  },
});
const route = useRoute();
const breadcrumbs = computed<Breadcrumb[]>(
  () => (route.meta.breadcrumbs as Breadcrumb[]) || [{ to: "/", label: "Home" }]
);
</script>

<template>
  <div class="app-container">
    <header>
      <div class="image-container">
        <img
          src="/images/capture-the-flag-logo.png"
          alt="Capture the Flag Logo"
        />
      </div>
      <div class="navigation-container">
        <ul>
          <li><NuxtLink :to="`/`">Home</NuxtLink></li>
          <li><NuxtLink :to="`/map`">Map</NuxtLink></li>
          <li><NuxtLink :to="`/bases`">Bases</NuxtLink></li>
          <li><NuxtLink :to="`/trackers`">Trackers</NuxtLink></li>
          <li>
            <NuxtLink :to="`/locations`">Locations</NuxtLink>
          </li>
          <li><NuxtLink :to="`/actions`">Actions</NuxtLink></li>
          <li><NuxtLink :to="`/stats`">Stats</NuxtLink></li>
        </ul>
      </div>
    </header>
    <main>
      <div class="breadcrumbs">
        <ul>
          <li v-for="(crumb, index) in breadcrumbs" :key="crumb.to">
            <NuxtLink v-if="index < breadcrumbs.length - 1" :to="crumb.to">{{
              crumb.label
            }}</NuxtLink>
            <span v-else>{{ crumb.label }}</span>
          </li>
        </ul>
      </div>

      <div class="main-container">
        <div class="page-container">
          <slot />
        </div>

        <div class="websocket-container">
          <WebSocket></WebSocket>
          <Clock></Clock>
        </div>
      </div>
    </main>
  </div>
</template>
<style>
html,
body {
  margin: 0;
  padding: 0;
}
body,
.app-container {
  background-color: black;
  color: white;
  font-family: Arial, Helvetica, sans-serif;
}

a {
  color: white;
}

.app-container {
  display: flex;
  align-items: stretch;
  min-height: 100vh;
}

header {
  display: flex;
  align-items: center;
  justify-items: flex-start;
  flex-direction: column;

  padding: 20px;
  border-right: solid 1px lightgray;
}

header img {
  margin-bottom: 20px;
  height: 72px;
  width: 72px;
}

header .navigation-container ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
header .navigation-container ul li {
  display: block;
  padding: 5px;
}

.breadcrumbs ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.breadcrumbs ul li {
  display: inline-block;
  padding: 10px 0;
  padding-left: 10px;
}
.breadcrumbs ul li:not(:last-child)::after {
  content: "/";
  display: inline-block;
  padding-left: 10px;
}

main {
  margin: 20px;
  width: 100%;
}

.main-container {
  width: 100%;
  display: flex;
  justify-content: space-between;
}
.page-container {
  flex-grow: 1;
}
.websocket-container {
  flex-shrink: 1;
}

table {
  border-collapse: collapse;
  width: 100%;
}

td,
th {
  border: 1px solid #555;
  padding: 3px 10px;
}
th {
  background-color: #1d483a; /*MVD dark border green*/
}
tbody tr:hover td,
tbody tr:hover th {
  background-color: #94c69780; /*MVD light green with 50% alpha*/
}

table {
  border-collapse: collapse;
}

td,
th {
  border: 1px solid #555;
  padding: 3px 10px;
}

form {
  max-width: 500px;
  margin-bottom: 20px;
}
form fieldset {
  display: flex;
  flex-direction: column;
}
form .form-row,
form .form-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0.5em;
}

form .form-row > label {
  flex: 1;
}
form .form-row > :not(label) {
  flex: 2;
}
form .form-actions > button {
  flex-shrink: 1;
}
</style>
