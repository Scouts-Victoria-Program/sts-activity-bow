<script setup lang="ts"></script>

<template>
  <div class="lister-controls">
    <slot></slot>
  </div>
</template>

<style>
.lister-controls {
  display: flex;
  align-content: space-between;
  align-items: center;
  width: 100%;
  padding: 15px 0;
}

.lister-controls > div {
  flex: 1;
}
</style>
