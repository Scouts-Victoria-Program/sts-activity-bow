<script setup lang="ts">
import type { VueElement } from "vue";
const { initialise, logs, sendMessage } = useWebSockets();

if (process.client) {
  onMounted(() => initialise());
}

const currentMessage = ref<string>("");
function sendCurrentMessage() {
  sendMessage("status", currentMessage.value);
  currentMessage.value = "";
}

const logContainer = ref<VueElement | null>(null);
function scrollToBottom() {
  const el = logContainer;

  // console.log(el.value);
  if (el.value) {
    const lastChild = el.value.querySelector(".log-row:last-child");
    const scroller = el.value.querySelector(".scroller");

    // console.log(lastChild, scroller);
    if (lastChild && scroller) {
      // console.log(lastChild.offsetTop);
      scroller.scroll(0, lastChild.offsetTop);
    }
  }
}

onMounted(() => scrollToBottom());

watch(
  () => logs,
  () => {
    scrollToBottom();
  }
);
</script>

<template>
  <div>
    <p @click="scrollToBottom()">scroll to bottom</p>

    <p class="log-show-datetimes">show all times</p>
    <input id="show-all-datetimes" class="log-show-datetimes" type="checkbox" />
    <label for="show-all-datetimes" class="log-show-datetimes">
      keep open
    </label>

    <div class="log-container" ref="logContainer">
      <div class="scroller">
        <div v-for="(log, index) in logs" :key="index" class="log-row">
          <code v-if="log.entity">
            [<NuxtLink :to="`/${log.entity.type}s/${log.entity.id}`"
              >{{ log.entity.type }}={{ log.entity.id }}</NuxtLink
            >]:
          </code>
          <code
            v-if="log.related"
            v-for="(related, index) in log.related"
            :key="index"
          >
            [<NuxtLink :to="`/${related.type}s/${related.id}`"
              >{{ related.type }}={{ related.id }}</NuxtLink
            >]
          </code>
          <code>{{ log.message }}</code>
          <code class="log-datetime">
            {{ log.datetime.toFormat("yy-MM-dd hh:mm:ss") }}
          </code>
        </div>
      </div>
    </div>
    <input
      v-model="currentMessage"
      @keyup.enter="sendCurrentMessage"
      type="text"
    />
    <button type="button" @click="sendCurrentMessage">Send message</button>
  </div>
</template>

<style scoped>
/* General Container styles */
.log-container {
  border: 1px solid #555;
}
/* .log-container .scroller {
  height: 70vh;
  overflow-y: scroll;
} */

/* Row styles */
.log-row {
  position: relative;
  padding-left: 5px;
  padding-right: 5px;
}
.log-row:hover {
  background: #202020;
}

/* Default datetime styles for each row */
.log-datetime {
  opacity: 0;
  z-index: -1;
  display: inline-block;
  position: absolute;
  right: 100%;
  top: 0;
  bottom: 0;
  white-space: nowrap;
  padding: 3px 7px;
  background: white;
  color: black;
}

/* Show date time controler */
p.log-show-datetimes {
  margin-bottom: 0;
}
label.log-show-datetimes {
  border: black 1px solid;
  font-style: italic;
}

/* When ShowAll element is checked or hovered  */
/* Update opacity */
input.log-show-datetimes:checked ~ .log-container .log-datetime,
.log-show-datetimes:hover ~ .log-container .log-datetime,
.log-row:hover .log-datetime {
  opacity: 1;
  z-index: 99;
}

/* When ShowAll element is checked or hovered  */
/* And elements are not first or last rows */
/* Set border radius */
input.log-show-datetimes:checked
  ~ .log-container
  .log-row:not(:first-child):not(:last-child)
  .log-datetime,
.log-show-datetimes:hover
  ~ .log-container
  .log-row:not(:first-child):not(:last-child)
  .log-datetime {
  border-radius: 0;
}

/* When ShowAll element is checked or hovered  */
/* And element is the first row */
/* Set border radius */
input.log-show-datetimes:checked
  ~ .log-container
  .log-row:first-child
  .log-datetime,
.log-show-datetimes:hover ~ .log-container .log-row:first-child .log-datetime {
  border-radius: 1rem 0 0 0;
}

/* When ShowAll element is checked or hovered  */
/* And element is the last row */
/* Set border radius */
input.log-show-datetimes:checked
  ~ .log-container
  .log-row:last-child
  .log-datetime,
.log-show-datetimes:hover ~ .log-container .log-row:last-child .log-datetime {
  border-radius: 0 0 0 1rem;
}

/* When ShowAll element is checked or hovered  */
/* And elements is the first and last row (ie only 1 row) */
/* Set border radius */
input.log-show-datetimes:checked
  ~ .log-container
  .log-row:first-child:last-child
  .log-datetime,
.log-show-datetimes:hover
  ~ .log-container
  .log-row:first-child:last-child
  .log-datetime {
  border-radius: 1rem 0 0 1rem;
}

/* When hovering over current row  */
/* Set border radius */
.log-row:hover .log-datetime {
  border-radius: 1rem 0 0 1rem;
}

/* Send message styles  */
input[type="text"],
button {
  border-style: solid;
  border-radius: 0;
}
</style>
