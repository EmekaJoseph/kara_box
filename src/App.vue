<script setup lang="ts">
import { userSongsStore } from './stores/songsStore';


const songsStore = userSongsStore()
</script>

<template>
  <RouterView />
</template>

<style>
:where(.btn-theme, .bg-theme, .btn-play) {
  background-color: v-bind('songsStore.settings.themeColor') !important;
}

:where(.btn-theme, .btn-play) {
  color: #ffffff !important;
}

.text-theme {
  color: v-bind('songsStore.settings.themeColor') !important;
}



/* .btn-play:hover{
  background-color: #424A21 !important;
} */


/* .btn-theme:hover {
  background-color: #3f1941 !important;
} */
</style>
