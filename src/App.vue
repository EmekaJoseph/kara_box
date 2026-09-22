<script setup lang="ts">
import { watchEffect } from 'vue';
import { userSongsStore } from './stores/songsStore';


const songsStore = userSongsStore()

// Set directly on the real document root so --theme-color is a genuine
// :root-level custom property that inherits everywhere. Using v-bind()
// in <style> here would instead inject the variable on this component's
// rendered root (a descendant of :root), which :root itself can't see.
watchEffect(() => {
  document.documentElement.style.setProperty('--theme-color', songsStore.settings.themeColor)
})
</script>

<template>
  <RouterView />
</template>

<style>
:root {
  --theme-color-soft: color-mix(in srgb, var(--theme-color) 16%, transparent);
  --theme-color-strong: color-mix(in srgb, var(--theme-color) 82%, black);
  --theme-color-bright: color-mix(in srgb, var(--theme-color) 65%, white 35%);
  --theme-glow: color-mix(in srgb, var(--theme-color) 65%, transparent 35%);
}

:where(.btn-theme, .bg-theme, .btn-play) {
  background-color: var(--theme-color) !important;
}

:where(.btn-theme, .btn-play) {
  color: #ffffff !important;
}

.text-theme {
  color: var(--theme-color) !important;
}

.border-theme {
  border-color: var(--theme-color) !important;
}

.btn-theme:hover,
.btn-play:hover {
  background-color: var(--theme-color-strong) !important;
}
</style>
