<script setup lang="ts">
import placeBlue from "@/assets/images/place_blue_24dp.svg";
import placeRed from "@/assets/images/place_red_24dp.svg";
import ColorHash from "color-hash";
import { DateTime } from "luxon";
import type { TrackerData } from "~/server/types/tracker";

const { useListAllBases, bases } = useBase();
const {
  pending: basePending,
  error: baseError,
  errorMessage: baseErrorMessage,
} = useListAllBases();

const { useListAllTrackers, trackers } = useTracker();
const {
  pending: trackerPending,
  error: trackerError,
  errorMessage: trackerErrorMessage,
} = useListAllTrackers();

const { useListAllTrackerLocations, trackerlocations } = useTrackerLocation();
const {
  pending: trackerlocationPending,
  error: trackerlocationError,
  errorMessage: trackerlocationErrorMessage,
} = useListAllTrackerLocations();

interface Path {
  lat: number;
  lng: number;
}

interface TrackerTraces {
  tracker: TrackerData;
  traces: Path[];
  colour: string;
}

const basesToShow = ref<number[]>([]);
function selectAllBases() {
  basesToShow.value = Object.values(bases.value).map((base) => base.id);
}
function deselectAllBases() {
  basesToShow.value = [];
}
const trackersToShow = ref<number[]>([]);
function selectAllTrackers() {
  trackersToShow.value = Object.values(trackers.value).map(
    (tracker) => tracker.id
  );
}
function deselectAllTrackers() {
  trackersToShow.value = [];
}
const trackerlocationShownWithinMinutes = ref<number>(60);

const filteredBases = computed(() => {
  return Object.values(bases.value)
    .filter(
      (base) => base.trackerlocationZoneLat && base.trackerlocationZoneLong
    )
    .filter((base) => basesToShow.value.includes(base.id));
});
const filteredTrackers = computed(() => {
  return Object.values(trackers.value).filter((tracker) =>
    trackersToShow.value.includes(tracker.id)
  );
});
const filterTrackerLocations = computed(() => {
  return Object.values(trackerlocations.value)
    .filter((trackerlocation) => trackerlocation.lat && trackerlocation.long)
    .filter(
      (trackerlocation) =>
        DateTime.fromISO(trackerlocation.datetime).diffNow("minutes").negate()
          .minutes <= trackerlocationShownWithinMinutes.value
    );
});

const trackerTraces = computed((): TrackerTraces[] => {
  const trackerTraces: TrackerTraces[] = [];

  for (const tracker of filteredTrackers.value) {
    trackerTraces.push({
      tracker,
      traces: filterTrackerLocations.value
        .filter((trackerlocation) => trackerlocation.trackerId === tracker.id)
        .reverse()
        .map(
          (trackerlocation): Path => ({
            lat: trackerlocation.lat,
            lng: trackerlocation.long,
          })
        ),
      colour: new ColorHash().hex(String(tracker.id)),
    });
  }

  return trackerTraces;
});

const initialCenter = { lat: -37.41012933716494, lng: 144.6960548304394 };

const openedMarkerBaseID = ref<number | null>(null);
function openMarkerBase(id: number | null) {
  openedMarkerBaseID.value = id;
}
const openedMarkerTrackerLocationID = ref<number | null>(null);
function openMarkerTrackerLocation(id: number | null) {
  openedMarkerTrackerLocationID.value = id;
}

watch(basePending, (pending) => pending === false && selectAllBases(), {
  immediate: true,
});
watch(trackerPending, (pending) => pending === false && selectAllTrackers(), {
  immediate: true,
});
</script>

<template>
  <div v-if="!basePending && !trackerlocationPending" class="container">
    <nav class="map-controls">
      <div class="trackerlocation-show-minutes">
        <h3>Traces</h3>
        <input
          v-model="trackerlocationShownWithinMinutes"
          type="range"
          min="30"
          :max="12 * 60"
          step="5"
        />
        <input
          v-model="trackerlocationShownWithinMinutes"
          type="number"
          step="5"
        />
        <span class="display-text">
          Showing the last<br />
          <span class="duration"
            >{{ Math.floor(trackerlocationShownWithinMinutes / 60) }}h
            {{ (trackerlocationShownWithinMinutes % 60).toFixed(0) }}m
          </span>
          <br />of trackerlocation traces
        </span>
      </div>
      <div class="select-base">
        <h3>Bases</h3>
        <div class="select-all-buttons">
          <button type="button" @click="selectAllBases()">all</button>
          <button type="button" @click="deselectAllBases()">none</button>
        </div>
        <div v-for="base in bases">
          <input
            v-model="basesToShow"
            type="checkbox"
            :id="`show-base-checkbox-${base.id}`"
            :value="base.id"
          />
          <label :for="`show-base-checkbox-${base.id}`">
            [{{ base.id }}] {{ base.name }}
          </label>
        </div>
      </div>
      <div class="select-tracker">
        <h3>Trackers</h3>
        <div class="select-all-buttons">
          <button type="button" @click="selectAllTrackers()">all</button>
          <button type="button" @click="deselectAllTrackers()">none</button>
        </div>
        <div v-for="tracker in trackers">
          <input
            v-model="trackersToShow"
            type="checkbox"
            :id="`show-tracker-checkbox-${tracker.id}`"
            :value="tracker.id"
          />
          <label :for="`show-tracker-checkbox-${tracker.id}`">
            [{{ tracker.id }}] {{ tracker.name }}
          </label>
        </div>
      </div>
    </nav>

    <div class="map-container">
      <ClientOnly>
        <GMapMap
          :center="initialCenter"
          :zoom="17"
          :options="{
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
          }"
          map-type-id="terrain"
        >
          <!-- Base TrackerLocation Zone Circles -->
          <GMapCircle
            :key="base.id"
            v-for="base in filteredBases"
            :radius="30"
            :center="{
              lat: base.trackerlocationZoneLat,
              lng: base.trackerlocationZoneLong,
            }"
          />
          <!-- Base TrackerLocation Zone Markers -->
          <GMapMarker
            v-for="base in filteredBases"
            :key="base.id"
            :position="{
              lat: base.trackerlocationZoneLat,
              lng: base.trackerlocationZoneLong,
            }"
            :clickable="true"
            :icon="{ url: placeBlue, scaledSize: { width: 40, height: 40 } }"
            @click="openMarkerBase(base.id)"
          >
            <GMapInfoWindow
              :closeclick="true"
              @closeclick="openMarkerBase(null)"
              :opened="openedMarkerBaseID === base.id"
            >
              <div style="color: black !important">
                {{ base.name }}
                <NuxtLink
                  :to="`/bases/${base.id}`"
                  style="color: black !important"
                >
                  Details
                </NuxtLink>
              </div>
            </GMapInfoWindow>
          </GMapMarker>

          <!-- Last TrackerLocation Positions -->

          <template
            v-for="trackerTrace in trackerTraces"
            :key="trackerTrace.tracker.id"
          >
            <GMapPolyline
              :path="trackerTrace.traces"
              :options="{ strokeColor: trackerTrace.colour }"
            ></GMapPolyline>

            <GMapMarker
              v-if="trackerTrace.traces.length >= 1"
              :position="trackerTrace.traces[0]"
              :clickable="true"
              :icon="{ url: placeRed, scaledSize: { width: 40, height: 40 } }"
              @click="openMarkerTrackerLocation(trackerTrace.tracker.id)"
            >
              <GMapInfoWindow
                :closeclick="true"
                @closeclick="openMarkerTrackerLocation(null)"
                :opened="
                  openedMarkerTrackerLocationID === trackerTrace.tracker.id
                "
              >
                <div style="color: black !important">
                  {{ trackerTrace.tracker.name }}
                  <NuxtLink
                    :to="`/trackers/${trackerTrace.tracker.id}`"
                    style="color: black !important"
                  >
                    Details
                  </NuxtLink>
                </div>
              </GMapInfoWindow>
            </GMapMarker>
          </template>
        </GMapMap>
      </ClientOnly>
    </div>
  </div>
  <div v-else>Loading data (this may take a moment)</div>
</template>

<style scoped>
.container {
  /* padding: 20px; padding-bottom: 0 */
  display: flex;
  padding-right: 20px;
  height: calc(100vh - 100px);
}

.map-controls {
  display: flex;
  flex-direction: column;
  max-width: 10rem;
  padding: 10px;
  overflow-y: scroll;
}

.select-base,
.select-tracker,
.trackerlocation-show-minutes {
  display: flex;
  flex-direction: column;
}

.select-all-buttons {
  display: flex;
}
.display-text .duration {
  font-size: 1.5rem;
  padding: 5px;
  display: inline-block;
}

.map-container {
  flex-grow: 1;
}

.vue-map-container {
  height: calc(100vh - 100px);
}
h3 {
  border-bottom: solid 1px #555;
}
</style>
