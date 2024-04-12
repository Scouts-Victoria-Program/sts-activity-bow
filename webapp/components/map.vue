<script setup lang="ts">
import placeBlue from "@/assets/images/place_blue_24dp.svg";
import placeRed from "@/assets/images/place_red_24dp.svg";
import basicBowLocations from "@/assets/geojson/basic_bow_location.json";
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

const { useListAllTrackerLocations, trackerLocations } = useTrackerLocation();
const {
  pending: trackerLocationPending,
  error: trackerLocationError,
  errorMessage: trackerLocationErrorMessage,
} = useListAllTrackerLocations();

type Path = [number, number];

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
const trackerLocationShownWithinMinutes = ref<number>(60);

const filteredBases = computed(() => {
  return Object.values(bases.value)
    .filter((base) => base.lat && base.long)
    .filter((base) => basesToShow.value.includes(base.id));
});
const filteredTrackers = computed(() => {
  return Object.values(trackers.value).filter((tracker) =>
    trackersToShow.value.includes(tracker.id)
  );
});
const filterTrackerLocations = computed(() => {
  return Object.values(trackerLocations.value)
    .filter((trackerLocation) => trackerLocation.lat && trackerLocation.long)
    .filter(
      (trackerLocation) =>
        DateTime.fromISO(trackerLocation.datetime).diffNow("minutes").negate()
          .minutes <= trackerLocationShownWithinMinutes.value
    );
});

const trackerTraces = computed((): TrackerTraces[] => {
  const trackerTraces: TrackerTraces[] = [];

  for (const tracker of filteredTrackers.value) {
    trackerTraces.push({
      tracker,
      traces: filterTrackerLocations.value
        .filter((trackerLocation) => trackerLocation.trackerId === tracker.id)
        .reverse()
        .map((trackerLocation): Path => locObj2Ary(trackerLocation)),
      colour: new ColorHash().hex(String(tracker.id)),
    });
  }

  return trackerTraces;
});

function locObj2Ary(obj: { lat?: number; long?: number }): Path {
  return [obj.long ?? 0, obj.lat ?? 0];
}

// const initialCenter = { lat: -37.41012933716494, lng: 144.6960548304394 }; // Rowallan
// const initialCenter = { lat: -37.75014584927347, lng: 144.8562113164426 }; // Burley Griffin
const initialCenter = { lat: -37.06511, lng: 145.50583 }; // Mafeking

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

const center = ref([initialCenter.lng, initialCenter.lat]);
const projection = ref("EPSG:4326");
const zoom = ref(18);
const rotation = ref(0);

const currentCenter = ref(center.value);
const currentZoom = ref(zoom.value);
const currentRotation = ref(rotation.value);
const currentResolution = ref(0);

function resolutionChanged(event: {
  target: { getResolution: () => number; getZoom: () => number };
}) {
  currentResolution.value = event.target.getResolution();
  currentZoom.value = event.target.getZoom();
}
function centerChanged(event: {
  target: { getCenter: () => [number, number] };
}) {
  currentCenter.value = event.target.getCenter();
}
function rotationChanged(event: { target: { getRotation: () => number } }) {
  currentRotation.value = event.target.getRotation();
}
import { GeoJSON } from "ol/format";
const geoJson = new GeoJSON();

const basicBowLocationsParsed = geoJson.readFeatures(basicBowLocations);

// const bottomLeftCorner = [145.50475409915896, -37.066784035724204];
// const topRightCorner = [145.50972327120928, -37.06327326112887];

const bottomLeftCorner = [145.499340200063, -37.06855325350198];

const topRightCorner = [145.51561527978475, -37.06131314146699];

const extent = ref([
  bottomLeftCorner[0],
  bottomLeftCorner[1],
  topRightCorner[0],
  topRightCorner[1],
]);
// const imageProjection = reactive({
//   code: "xkcd-image",
//   units: "pixels",
//   extent: extent,
// });
const strokeWidth = ref(10);
const stroke = ref("#ff0000");
const fill = ref("#ffffff");
// const imgUrl = ref("https://imgs.xkcd.com/comics/online_communities.png");
const imgUrl = ref(
  "https://cdna.artstation.com/p/assets/images/images/057/708/984/large/rutger-van-de-steeg-nebula-explosion-final.jpg?1672423037"
);
const imgCopyright = ref('© <a href="http://xkcd.com/license.html">xkcd</a>');
</script>

<template>
  <div v-if="!basePending && !trackerLocationPending" class="container">
    <nav class="map-controls">
      <div class="trackerLocation-show-minutes">
        <h3>Traces</h3>
        <input
          v-model="trackerLocationShownWithinMinutes"
          type="range"
          min="30"
          :max="12 * 60"
          step="5"
        />
        <input
          v-model="trackerLocationShownWithinMinutes"
          type="number"
          step="5"
        />
        <span class="display-text">
          Showing the last<br />
          <span class="duration"
            >{{ Math.floor(trackerLocationShownWithinMinutes / 60) }}h
            {{ (trackerLocationShownWithinMinutes % 60).toFixed(0) }}m
          </span>
          <br />of trackerLocation traces
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
        <ol-map style="height: 70vh">
          <ol-view
            ref="view"
            :center="center"
            :rotation="rotation"
            :zoom="zoom"
            :projection="projection"
            @change:center="centerChanged"
            @change:resolution="resolutionChanged"
            @change:rotation="rotationChanged"
          />

          <ol-rotate-control></ol-rotate-control>
          <ol-interaction-link />

          <ol-tile-layer>
            <ol-source-osm />
          </ol-tile-layer>

          <!-- <ol-image-layer>
            <ol-source-image-static
              :url="imgUrl"
              :imageExtent="extent"
            ></ol-source-image-static>
          </ol-image-layer> -->

          <ol-vector-layer>
            <!-- Base TrackerLocation Zone Circles -->
            <ol-feature :key="base.id" v-for="base in filteredBases">
              <ol-geom-circle
                :center="locObj2Ary(base)"
                :radius="30"
              ></ol-geom-circle>
              <ol-style>
                <ol-style-stroke color="red" :width="3"></ol-style-stroke>
                <ol-style-fill color="rgba(255,200,0,0.2)"></ol-style-fill>
              </ol-style>
            </ol-feature>
          </ol-vector-layer>

          <!-- Base TrackerLocation Zone Markers -->
          <ol-vector-layer>
            <ol-source-vector>
              <ol-feature v-for="base in filteredBases" :key="base.id">
                <ol-geom-point :coordinates="locObj2Ary(base)"></ol-geom-point>
                <ol-style>
                  <ol-style-circle :radius="4">
                    <ol-style-fill :color="fill"></ol-style-fill>
                    <ol-style-stroke
                      :color="stroke"
                      :width="strokeWidth"
                    ></ol-style-stroke>
                    <!-- TODO Add marker pop up-->
                  </ol-style-circle>
                </ol-style>
              </ol-feature>
            </ol-source-vector>
          </ol-vector-layer>

          <!-- Last TrackerLocation Positions -->
          <ol-vector-layer>
            <ol-source-vector>
              <template
                v-for="trackerTrace in trackerTraces"
                :key="trackerTrace.tracker.id"
              >
                <ol-feature>
                  <ol-geom-line-string
                    :coordinates="trackerTrace.traces"
                  ></ol-geom-line-string>
                  <ol-style>
                    <ol-style-stroke
                      :color="trackerTrace.colour"
                      :width="2"
                    ></ol-style-stroke>
                  </ol-style>
                </ol-feature>

                <ol-feature v-if="trackerTrace.traces.length >= 1">
                  <ol-geom-point
                    :coordinates="trackerTrace.traces[0]"
                  ></ol-geom-point>
                  <ol-style>
                    <ol-style-circle :radius="radius">
                      <ol-style-fill :color="fill"></ol-style-fill>
                      <ol-style-stroke
                        :color="stroke"
                        :width="strokeWidth"
                      ></ol-style-stroke>
                      <!-- TODO Add marker pop up-->
                    </ol-style-circle>
                  </ol-style>
                </ol-feature>
              </template>
            </ol-source-vector>
          </ol-vector-layer>

          <!-- Placeholder info display -->
          <ol-vector-image-layer>
            <ol-source-vector
              :features="basicBowLocationsParsed"
              :format="geoJson"
            ></ol-source-vector>
          </ol-vector-image-layer>
        </ol-map>

        <ul>
          <li>center : {{ currentCenter }}</li>
          <li>resolution : {{ currentResolution }}</li>
          <li>zoom : {{ currentZoom }}</li>
          <li>rotation : {{ currentRotation }}</li>
        </ul>
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
.trackerLocation-show-minutes {
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

.ol-map {
  position: relative;
}
.ol-map-loading:after {
  content: "";
  box-sizing: border-box;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  margin-top: -40px;
  margin-left: -40px;
  border-radius: 50%;
  border: 5px solid rgba(180, 180, 180, 0.6);
  border-top-color: var(--vp-c-brand-1);
  animation: spinner 0.6s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}
</style>
