<script setup lang="ts">
import type { LogData } from "~/server/types/log";
import { DateTime } from "luxon";

const props = defineProps<{
  log: LogData;
}>();
const log = props.log;

const { useFetchTeam } = useTeam();
const { useFetchTracker } = useTracker();

const { team, loading: teamLoading } = useFetchTeam(log.teamId);
const { tracker, loading: trackerLoading } = useFetchTracker(log.trackerId);
</script>

<template>
  <tr>
    <td>{{ log.id }}</td>
    <td>
      {{
        DateTime.fromISO(log.datetime).toLocaleString(DateTime.DATETIME_SHORT)
      }}
    </td>
    <td>{{ log.lat }}</td>
    <td>{{ log.long }}</td>
    <td>
      <NuxtLink :to="`/trackers/${log.trackerId}`">
        <span v-if="!trackerLoading">
          {{ tracker?.name }}
        </span>
        <span v-else>Loading</span>
      </NuxtLink>
    </td>
    <td>
      <NuxtLink :to="`/teams/${log.teamId}`">
        <span v-if="!teamLoading">
          {{ team?.name }}
        </span>
        <span v-else>Loading</span>
      </NuxtLink>
    </td>
    <td>{{ log.distance }}</td>
    <td><NuxtLink :to="`/logs/${log.id}`">show</NuxtLink></td>
  </tr>
</template>
