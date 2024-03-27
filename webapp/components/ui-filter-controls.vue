<script setup lang="ts">
const props = defineProps<{
  filters: UiFilterControls;
}>();

const filters = props.filters;
</script>

<template>
  <div class="filter-container">
    <div>Filters:</div>
    <div v-for="(value, key) in filters.fields" :key="key" class="filter-field">
      <div class="filter-key">{{ key }}:</div>

      <div v-if="filters.fixedFilters.includes(key)">{{ value.value }}</div>
      <input v-else v-model="filters.fields[key].value" />
    </div>
  </div>
</template>

<style scoped>
.filter-container {
  display: flex;
  align-items: center;
  align-content: space-between;
}
.filter-field input {
  width: 100%;
}
.filter-key {
  padding-bottom: 5px;
  font-weight: bold;
}
</style>
