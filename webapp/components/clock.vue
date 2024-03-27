<script setup lang="ts">
import { DateTime } from "luxon";

const currentTime = ref("");
const fiveMinutesTime = ref("");
setInterval(() => {
  currentTime.value = DateTime.now().toLocaleString(
    DateTime.TIME_24_WITH_SECONDS
  );
  fiveMinutesTime.value = DateTime.now()
    .plus({ minute: 5 })
    .toLocaleString(DateTime.TIME_24_WITH_SECONDS);
}, 100);
</script>

<template>
  <div class="clock-container">
    <div>{{ currentTime }}</div>
    <div style="color: lightgreen">{{ fiveMinutesTime }}</div>
  </div>
</template>

<style scoped>
.clock-container {
  display: flex;
  font-size: 4rem;
  flex-direction: column;
}
</style>
