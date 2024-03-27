<script setup lang="ts">
const props = defineProps<{
  columns: number;
  rows: number;
}>();

const range = (n: number) => [...Array(n).keys()];
</script>

<template>
  <table>
    <thead>
      <tr>
        <th v-for="column in range(props.columns)" :key="column">
          <div class="skeleton"></div>
        </th>
      </tr>
    </thead>
    <thead>
      <tr v-for="row in range(props.rows)" :key="row">
        <td v-for="column in range(props.columns)" :key="column">
          <div class="skeleton"></div>
        </td>
      </tr>
    </thead>
  </table>
</template>

<style>
.skeleton {
  animation: skeleton-loading 1s linear infinite alternate;
  height: 1rem;
  margin: 3px;
  border-radius: 0.5rem;
}

@keyframes skeleton-loading {
  0% {
    background-color: hsl(195, 2%, 61%);
  }
  100% {
    background-color: hsl(200, 4%, 31%);
  }
}
</style>
