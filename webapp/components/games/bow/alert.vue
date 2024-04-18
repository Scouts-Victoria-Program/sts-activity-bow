<script setup lang="ts">
import ColorHash from "color-hash";
import { Duration } from "luxon";
import type { BowAlertData } from "~/server/types/bowAlert";
const props = defineProps<{
  alert: BowAlertData;
  expiryControl: {
    getById(id: number): ComputedRef<Duration | undefined>;
  };
}>();

const { getBase } = useBase();
const base = getBase(props.alert.baseId);

const idHashed = new ColorHash().hex(String(props.alert.id));

const SECONDS = 1;
const MINUTES = SECONDS * 60;

const expiryRef = props.expiryControl.getById(props.alert.id);

const displayCountdown = computed(() => {
  const expiry = expiryRef.value;
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

const displayColour = computed(() => {
  const expiry = expiryRef.value;
  if (!expiry) {
    return "white";
  }

  const seconds = expiry.shiftTo("seconds").seconds;

  if (seconds > 7 * MINUTES) {
    return "white";
  } else if (seconds > 4 * MINUTES) {
    return "orange";
  } else if (seconds > 2 * MINUTES) {
    return "red";
  } else {
    return "purple";
  }
});

const displayFlash = computed(() => {
  const expiry = expiryRef.value;
  if (!expiry) {
    return true;
  }

  const seconds = expiry.shiftTo("seconds").seconds;

  if (seconds < 60) {
    return true;
  } else {
    return false;
  }
});
const displayTimeFlash = computed(() => {
  const expiry = expiryRef.value;
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
  <div class="row row-vertical alert" :class="{ flash: displayFlash }">
    <div class="row alert-header">
      <div class="column alert-msg">
        <h2>Distress Signal {{ idHashed.toUpperCase() }}</h2>
      </div>
      <div class="column alert-timer">
        <div class="countdown-container">
          <div
            :class="{ flash: displayTimeFlash }"
            :style="{ color: displayColour }"
          >
            Expires
            {{ displayCountdown }}
          </div>
        </div>
      </div>
    </div>

    <!-- <div class="alert-body">Action: {{ props.alert.action }}<br /></div> -->
    <div class="row">
      <div class="column">WARNING: {{ props.alert.description }}<br /></div>

      <div class="column">
        Location: {{ base?.name }}<br />
        Security Code: XXXXDDD
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
  border: red solid thin;
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
