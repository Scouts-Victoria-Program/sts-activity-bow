// import functions from "./sockets/index";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: ["nuxt3-socket.io"],
  build: { transpile: ["@fawmi/vue-google-maps"] },
  runtimeConfig: {
    mqtt: {
      host: "mqtt://au1.cloud.thethings.network:1883",
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_API_KEY,
    },
    public: {
      trackerLocationCapturedDistance: 50,
      trackerLocationWindowIntervalMinutes: 1,
      trackerLocationKeepAliveMinutes: 160,
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      scoreModifiers: {
        trackerLocationMinute: 1,
        trackerLocationVisibilityViolation: -60,
        capturedLifeToken: 1,
        missingLifeToken: -30,
        gameOfChanceWin: 1,
        gameOfChanceLose: -1,
        respawn: 1,
        otherActions: 1,
        bonus: { mostConcurrentTrackerLocations: 15 },
      },
    },
  },
  vite: {
    optimizeDeps: {
      include: ["@fawmi/vue-google-maps", "fast-deep-equal"],
    },
  },
});
