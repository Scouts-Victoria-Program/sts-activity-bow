<script setup lang="ts">
const { usePollBowAlerts } = useBowAlert();

const props = defineProps<{ faction: string }>();

const { activeBowAlerts, expiryControl, poller } = usePollBowAlerts(
  props.faction
);

function expireAlert(id: number) {
  var index = activeBowAlerts.value.findIndex(
    (alertData) => alertData.id === id
  );

  if (index > -1) {
    activeBowAlerts.value.splice(index, 1);
  }
}

onBeforeUnmount(() => {
  poller.pause();
});
</script>

<template>
  <div>
    <GamesBowAlertLastScan
      :duration-since-last-fetch="poller.durationSinceLastFetch"
    ></GamesBowAlertLastScan>
    <GamesBowAlert
      v-for="bowAlert in activeBowAlerts"
      :key="bowAlert.id"
      :alert="bowAlert"
      :expiry-control="expiryControl"
      @expired="expireAlert"
    ></GamesBowAlert>
  </div>
</template>
