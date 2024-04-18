<script setup lang="ts">
import ColorHash from "color-hash";
import { DateTime, Duration } from "luxon";
import type { BowAlertData } from "~/server/types/bowAlert";
const props = defineProps<{
  durationSinceLastFetch: Ref<Duration>;
}>();

const displayCountdown = computed(() => {
  const expiry = props.durationSinceLastFetch.value;
  if (!expiry) {
    return "loading";
  }

  const future = expiry.milliseconds > 0;
  const absDuration = future ? expiry : expiry.negate();

  const durMinSec = absDuration.shiftTo("minutes", "seconds").toObject();

  let pp: string[] = [];

  if (future) {
    pp.push("in");
  }
  if (Number(durMinSec.minutes) > 0) {
    pp.push(`${durMinSec.minutes?.toFixed(0).padStart(2, "0")}m`);
  }
  pp.push(`${durMinSec.seconds?.toFixed(0).padStart(2, "0")}s`);
  if (!future) {
    pp.push("ago");
  }
  return pp.join(" ");
});
const displayTimeFlash = computed(() => {
  const expiry = props.durationSinceLastFetch.value;
  if (!expiry) {
    return false;
  }

  const seconds = expiry.shiftTo("seconds").seconds;

  const modSeconds = seconds % 60;
  if (seconds < 60) {
    // The whole element will flash so we dont need the time doing it too.
    return false;
  } else if (between(modSeconds, 55, 60) || between(modSeconds, 0, 5)) {
    return true;
  } else {
    return false;
  }
});

function between(x: number, a: number, b: number) {
  return a <= x && x <= b;
}
</script>

<template>
  <div class="row row-vertical alert">
    <div class="row alert-header">
      <div class="column alert-msg">
        <h2>Last Scan</h2>
      </div>
      <div class="column alert-timer">
        <div class="countdown-container">
          <div :class="{ flash: displayTimeFlash }">
            {{ displayCountdown }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.row-vertical {
  flex-direction: column;
}

.column {
  flex: auto;
}

.alert {
  border: green solid thin;
  margin: 5px;
  padding: 5px;
}

.alert-header {
  padding-bottom: 15px;
}
.alert-header h2 {
  margin-top: 0;
}
/* .alert-msg {
  flex-grow: 1;
}
.alert-timer {
  flex-grow: 0;
} */

.countdown-container {
  white-space: nowrap;
  font-family: "Courier New", Courier, monospace;
}
.flash {
  animation: blinker 1s linear infinite;
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}
</style>
