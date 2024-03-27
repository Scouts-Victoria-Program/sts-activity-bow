<script setup lang="ts">
import type { StatSet } from "~/server/types/stat";

const props = defineProps<{
  label: string;
  values: StatSet[];
}>();

interface StdStat {
  raw: number | string;
  hasScore: boolean;
  score: number;
  scoreColour: string;
  scoreSign: string;
  description: string;
  link: string;
}
function stdStat(value?: StatSet): StdStat {
  if (!value) {
    return {
      raw: "-",
      hasScore: false,
      score: 0,
      scoreColour: "white",
      scoreSign: "?",
      description: "",
      link: "/stats",
    };
  }

  return {
    raw: value.raw,
    hasScore: value.score !== 0,
    score: Math.abs(value.score),
    scoreColour:
      value.score < 0 ? "red" : value.score > 0 ? "lightgreen" : "white",
    scoreSign: value.score < 0 ? "-" : value.score > 0 ? "+" : "?",
    description: value.description,
    link: value.link,
  };
}
</script>

<template>
  <tr>
    <th>{{ props.label }}</th>

    <td
      v-for="(value, index) in props.values"
      :key="`row-${label.replace(' ', '')}-${index}`"
      :title="stdStat(value).description"
    >
      <NuxtLink :to="stdStat(value).link"> {{ stdStat(value).raw }}</NuxtLink
      ><br />
      <small
        :style="{ color: stdStat(value).scoreColour }"
        v-if="stdStat(value).hasScore"
      >
        ({{ stdStat(value).scoreSign }}{{ stdStat(value).score }})
      </small>
    </td>
  </tr>
</template>

<style scoped>
td {
  text-align: center;
}
small {
  display: block;
}
</style>
