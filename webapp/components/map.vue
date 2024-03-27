<script setup lang="ts">
import placeBlue from "@/assets/images/place_blue_24dp.svg";
import placeRed from "@/assets/images/place_red_24dp.svg";
import ColorHash from "color-hash";
import { DateTime } from "luxon";
import type { TrackerData } from "~/server/types/tracker";

const { useListAllTeams, teams } = useTeam();
const {
  pending: teamPending,
  error: teamError,
  errorMessage: teamErrorMessage,
} = useListAllTeams();

const { useListAllTrackers, trackers } = useTracker();
const {
  pending: trackerPending,
  error: trackerError,
  errorMessage: trackerErrorMessage,
} = useListAllTrackers();

const { useListAllFlags, flags } = useFlag();
const {
  pending: flagPending,
  error: flagError,
  errorMessage: flagErrorMessage,
} = useListAllFlags();

interface Path {
  lat: number;
  lng: number;
}

interface TrackerTraces {
  tracker: TrackerData;
  traces: Path[];
  colour: string;
}

const teamsToShow = ref<number[]>([]);
function selectAllTeams() {
  teamsToShow.value = Object.values(teams.value).map((team) => team.id);
}
function deselectAllTeams() {
  teamsToShow.value = [];
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
const flagShownWithinMinutes = ref<number>(60);

const filteredTeams = computed(() => {
  return Object.values(teams.value)
    .filter((team) => team.flagZoneLat && team.flagZoneLong)
    .filter((team) => teamsToShow.value.includes(team.id));
});
const filteredTrackers = computed(() => {
  return Object.values(trackers.value).filter((tracker) =>
    trackersToShow.value.includes(tracker.id)
  );
});
const filterFlags = computed(() => {
  return Object.values(flags.value)
    .filter((flag) => flag.lat && flag.long)
    .filter(
      (flag) =>
        DateTime.fromISO(flag.datetime).diffNow("minutes").negate().minutes <=
        flagShownWithinMinutes.value
    );
});

const trackerTraces = computed((): TrackerTraces[] => {
  const trackerTraces: TrackerTraces[] = [];

  for (const tracker of filteredTrackers.value) {
    trackerTraces.push({
      tracker,
      traces: filterFlags.value
        .filter((flag) => flag.trackerId === tracker.id)
        .reverse()
        .map((flag): Path => ({ lat: flag.lat, lng: flag.long })),
      colour: new ColorHash().hex(String(tracker.id)),
    });
  }

  return trackerTraces;
});

const initialCenter = { lat: -37.41012933716494, lng: 144.6960548304394 };

const openedMarkerTeamID = ref<number | null>(null);
function openMarkerTeam(id: number | null) {
  openedMarkerTeamID.value = id;
}
const openedMarkerFlagID = ref<number | null>(null);
function openMarkerFlag(id: number | null) {
  openedMarkerFlagID.value = id;
}

watch(teamPending, (pending) => pending === false && selectAllTeams(), {
  immediate: true,
});
watch(trackerPending, (pending) => pending === false && selectAllTrackers(), {
  immediate: true,
});
</script>

<template>
  <div v-if="!teamPending && !flagPending" class="container">
    <nav class="map-controls">
      <div class="flag-show-minutes">
        <h3>Traces</h3>
        <input
          v-model="flagShownWithinMinutes"
          type="range"
          min="30"
          :max="12 * 60"
          step="5"
        />
        <input v-model="flagShownWithinMinutes" type="number" step="5" />
        <span class="display-text">
          Showing the last<br />
          <span class="duration"
            >{{ Math.floor(flagShownWithinMinutes / 60) }}h
            {{ (flagShownWithinMinutes % 60).toFixed(0) }}m
          </span>
          <br />of flag traces
        </span>
      </div>
      <div class="select-team">
        <h3>Teams</h3>
        <div class="select-all-buttons">
          <button type="button" @click="selectAllTeams()">all</button>
          <button type="button" @click="deselectAllTeams()">none</button>
        </div>
        <div v-for="team in teams">
          <input
            v-model="teamsToShow"
            type="checkbox"
            :id="`show-team-checkbox-${team.id}`"
            :value="team.id"
          />
          <label :for="`show-team-checkbox-${team.id}`">
            [{{ team.id }}] {{ team.name }}
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
          <!-- Team Flag Zone Circles -->
          <GMapCircle
            :key="team.id"
            v-for="team in filteredTeams"
            :radius="30"
            :center="{ lat: team.flagZoneLat, lng: team.flagZoneLong }"
          />
          <!-- Team Flag Zone Markers -->
          <GMapMarker
            v-for="team in filteredTeams"
            :key="team.id"
            :position="{ lat: team.flagZoneLat, lng: team.flagZoneLong }"
            :clickable="true"
            :icon="{ url: placeBlue, scaledSize: { width: 40, height: 40 } }"
            @click="openMarkerTeam(team.id)"
          >
            <GMapInfoWindow
              :closeclick="true"
              @closeclick="openMarkerTeam(null)"
              :opened="openedMarkerTeamID === team.id"
            >
              <div style="color: black !important">
                {{ team.name }}
                <NuxtLink
                  :to="`/teams/${team.id}`"
                  style="color: black !important"
                >
                  Details
                </NuxtLink>
              </div>
            </GMapInfoWindow>
          </GMapMarker>

          <!-- Last Flag Positions -->

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
              @click="openMarkerFlag(trackerTrace.tracker.id)"
            >
              <GMapInfoWindow
                :closeclick="true"
                @closeclick="openMarkerFlag(null)"
                :opened="openedMarkerFlagID === trackerTrace.tracker.id"
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

.select-team,
.select-tracker,
.flag-show-minutes {
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
