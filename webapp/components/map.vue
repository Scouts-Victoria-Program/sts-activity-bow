<script setup lang="ts">
import placeBlue from "@/assets/images/place_blue_24dp.svg";
import placeRed from "@/assets/images/place_red_24dp.svg";
import basicBowLocations from "@/assets/geojson/basic_bow_location.json";
import ColorHash from "color-hash";
import { DateTime } from "luxon";
import type { TrackerData } from "~/server/types/tracker";
import type { Item } from "ol-contextmenu";
import { MapBrowserEvent, type View } from "ol";

import { GeoJSON } from "ol/format";
const geoJson = new GeoJSON();

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

// const initialCenter = { lat: -37.41012933716494, long: 144.6960548304394 }; // Rowallan
// const initialCenter = { lat: -37.75014584927347, long: 144.8562113164426 }; // Burley Griffin
const initialCenter = { lat: -37.06511, long: 145.50583 }; // Mafeking

// const openedMarkerBaseID = ref<number | null>(null);
// function openMarkerBase(id: number | null) {
//   openedMarkerBaseID.value = id;
// }
// const openedMarkerTrackerLocationID = ref<number | null>(null);
// function openMarkerTrackerLocation(id: number | null) {
//   openedMarkerTrackerLocationID.value = id;
// }

watch(basePending, (pending) => pending === false && selectAllBases(), {
  immediate: true,
});
watch(trackerPending, (pending) => pending === false && selectAllTrackers(), {
  immediate: true,
});

const center = ref(locObj2Ary(initialCenter));
const projection = ref("EPSG:4326");
const zoom = ref(18);
const rotation = ref(0);

const basicBowLocationsParsed = geoJson.readFeatures(basicBowLocations);

const bottomLeftCorner = { lat: -37.06855325350198, long: 145.499340200063 };
const topRightCorner = { lat: -37.06131314146699, long: 145.51561527978475 };

const imageExtent = ref([
  ...locObj2Ary(bottomLeftCorner),
  ...locObj2Ary(topRightCorner),
]);
const imageUrl = ref(
  "https://cdna.artstation.com/p/assets/images/images/057/708/984/large/rutger-van-de-steeg-nebula-explosion-final.jpg?1672423037"
);

const contextMenuItems = ref<Item[]>([]);
const view = ref<View | null>(null);

import marker from "@/assets/images/place_blue_24dp.svg";
import type { BaseCreateInput } from "~/server/types/base";
import { pointerMove } from "ol/events/condition";
import { Fill, Stroke, Style } from "ol/style";

function inAndOut(x: number): number {
  // console.log(x, x < 0.5 ? x * 2 : (1 - x) * 2, x < 0.5, x * 2, (1 - x) * 2);
  if (x < 0.5) {
    return x * 2;
  } else {
    return (1 - x) * 2;
  }
}

contextMenuItems.value = [
  {
    text: "Center map here",
    callback: (val) => {
      view.value?.setCenter(val.coordinate);
    },
  },
  {
    text: "Add a Base",
    icon: marker,
    callback: async (val) => {
      const { useCreateBase } = useBase();
      const { create, created, loading, error, errorMessage } = useCreateBase();

      const newName = prompt("Base Name:");
      if (!newName) {
        return;
      }
      const reqBody: BaseCreateInput = {
        name: newName,
        lat: val.coordinate[1],
        long: val.coordinate[0],
      };
      const baseId = await create(reqBody);

      if (error.value) {
        alert(`Failed to create base ${errorMessage.value}`);
      } else {
        alert(`Base Created ${baseId}`);
      }
    },
  },
  "-", // this is a separator
];

const scaledMetres = 0.0005 / 100;

const selectCondition = pointerMove;

const featureSelected = (event: MapBrowserEvent<PointerEvent>) => {
  // const pixel = event.pixel;
  // event.map.forEachFeatureAtPixel(pixel, ()=>{

  // });
  console.log("featureSelectedEvent", event);
};

const selectInteactionFilter = (feature: any) => {
  console.log("selectInteactionFilter", feature);
  return true;
  // return feature.values_.name != undefined;
};

const showLabels = ref(false);
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
      <div class="show-labels">
        <h3>Labels</h3>
        <div>
          <input v-model="showLabels" id="show-labels" type="checkbox" />
          <label for="show-labels"> Show Labels </label>
        </div>
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
            :center="center"
            :rotation="rotation"
            :zoom="zoom"
            :projection="projection"
          />

          <ol-interaction-link />
          <ol-zoom-control zoomInLabel="➕" zoomOutLabel="➖" />
          <ol-fullscreen-control />
          <ol-scaleline-control />
          <ol-context-menu-control :items="contextMenuItems" />
          <ol-layerswitcher-control />

          <ol-tile-layer title="Open Street Map">
            <ol-source-osm />
          </ol-tile-layer>

          <ol-image-layer title="Nebula Image">
            <ol-source-image-static
              :url="imageUrl"
              :imageExtent="imageExtent"
            ></ol-source-image-static>
          </ol-image-layer>

          <!-- Bases -->
          <ol-vector-layer title="Bases">
            <!-- Base Circles -->
            <ol-source-vector>
              <!-- <ol-animation-fade
                :key="base.id"
                v-for="(base, index) in filteredBases"
                :duration="index * 500 + 2000"
                :repeat="999"
                :easing="inAndOut"
                :hiddenStyle="animatedStyle"
              > -->
              <ol-feature
                :key="base.id"
                v-for="(base, index) in filteredBases"
                :properties="{ id: `base-${base.id}` }"
              >
                <ol-geom-circle
                  :center="locObj2Ary(base)"
                  :radius="scaledMetres * 30"
                ></ol-geom-circle>
                <ol-style>
                  <ol-style-stroke color="red" :width="3"></ol-style-stroke>
                  <ol-style-fill color="rgba(0,0,0,0)"></ol-style-fill>
                  <ol-style-text
                    :text="showLabels ? base.name : ''"
                    backgroundFill="#ffffff"
                    :padding="[5, 5, 5, 5]"
                  ></ol-style-text>
                </ol-style>
              </ol-feature>
              <!-- </ol-animation-fade> -->
            </ol-source-vector>
          </ol-vector-layer>

          <!-- Last Tracker Positions -->
          <ol-vector-layer title="Trackers">
            <ol-source-vector>
              <template
                v-for="trackerTrace in trackerTraces"
                :key="trackerTrace.tracker.id"
              >
                <ol-feature>
                  <ol-geom-line-string
                    :coordinates="trackerTrace.traces"
                  ></ol-geom-line-string>
                  <ol-style-flowline
                    :color="trackerTrace.colour"
                    color2="grey"
                    :width="6"
                    :width2="0"
                  />
                  <!-- <ol-style>
                    <ol-style-stroke
                      :color="trackerTrace.colour"
                      :width="2"
                    ></ol-style-stroke>
                  </ol-style> -->
                </ol-feature>

                <ol-feature v-if="trackerTrace.traces.length >= 1">
                  <ol-geom-point
                    :coordinates="trackerTrace.traces[0]"
                  ></ol-geom-point>
                  <ol-style>
                    <ol-style-circle :radius="10">
                      <ol-style-fill
                        :color="trackerTrace.colour"
                      ></ol-style-fill>
                      <ol-style-stroke
                        color="#FFFFFF"
                        :width="2"
                      ></ol-style-stroke>
                      <ol-style-text
                        :text="showLabels ? trackerTrace.tracker.name : ''"
                        backgroundFill="#ffffff"
                        :padding="[5, 5, 5, 5]"
                      ></ol-style-text>
                      <!-- TODO Add marker pop up-->
                    </ol-style-circle>
                  </ol-style>
                </ol-feature>
              </template>
            </ol-source-vector>
          </ol-vector-layer>

          <ol-interaction-select
            @select="featureSelected"
            :condition="selectCondition"
            :filter="selectInteactionFilter"
          >
            <ol-style>
              <ol-style-stroke color="green" :width="4"></ol-style-stroke>
              <ol-style-fill color="rgba(255,255,255,0.5)"></ol-style-fill>
              <ol-style-icon :src="marker" :scale="0.05"></ol-style-icon>
            </ol-style>
          </ol-interaction-select>

          <!-- Placeholder info display -->
          <ol-vector-image-layer title="Dev Design">
            <ol-source-vector
              :features="basicBowLocationsParsed"
              :format="geoJson"
            ></ol-source-vector>
          </ol-vector-image-layer>
        </ol-map>
      </ClientOnly>
    </div>
  </div>
  <div v-else>Loading data (this may take a moment)</div>
</template>

<style>
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
.map-controls h3 {
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

.ol-layerswitcher {
  color: black !important;
}
</style>
