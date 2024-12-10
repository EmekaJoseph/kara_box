<script setup lang="ts">
import { userSongsStore } from './stores/songsStore';


const songsStore = userSongsStore()
</script>

<template>
  <RouterView />
</template>

<style>
.btn-theme {
  /* background-color: #48214A !important; */
  background-color: v-bind('songsStore.settings.themeColor') !important;
  color: #ffffff !important;
}

.btn-play {
  background-color: v-bind('songsStore.settings.themeColor') !important;
  color: #ffffff !important;
}


/* .btn-play:hover{
  background-color: #424A21 !important;
} */


/* .btn-theme:hover {
  background-color: #3f1941 !important;
} */
</style>
