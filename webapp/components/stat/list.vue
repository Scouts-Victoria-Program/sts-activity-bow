<script setup lang="ts">
const { stats, useFetchStats } = useStat();
const { refresh, loading, error, errorMessage } = useFetchStats();
</script>

<template>
  <div>
    <h2>Stats</h2>
    <button type="button" @click="refresh()">Refresh</button>

    <div v-if="error">Unable to load stats {{ errorMessage }}</div>
    <div v-else-if="loading">Loading Stats</div>
    <div v-else>
      <table v-if="stats">
        <thead>
          <th>Team</th>
          <th v-for="team in stats.teams" :key="team.id">
            <NuxtLink :to="`/teams/${team.id}`">
              {{ team.id }}
            </NuxtLink>
          </th>
        </thead>
        <tbody>
          <StatRow
            v-for="(label, statType) in stats.statTypes"
            :label="label"
            :values="stats.teams.map((team) => team.stats[statType] ?? 0)"
          ></StatRow>
        </tbody>
        <tfoot>
          <th>Total</th>
          <th v-for="team in stats.teams" :key="team.id">
            {{ team.score }}
          </th>
        </tfoot>
      </table>

      <pre>{{ JSON.stringify(stats, null, 2) }}</pre>
    </div>
  </div>
</template>
