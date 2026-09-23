<template>
  <div class="stage">
    <div class="stage-media"></div>
    <div class="stage-scrim"></div>

    <button v-tooltip title="Settings" type="button"
      @click="songsStore.settings.togglePanel = !songsStore.settings.togglePanel" class="icon-fab settings-fab">
      <i class="bi bi-gear-fill"></i>
    </button>

    <div class="stage-content">
      <div class="app-card">
        <div class="app-card-header">
          <span class="eyebrow"><i class="bi bi-mic-fill"></i> Karaoke Box <span class="blink-dot"></span></span>
          <h1 class="app-title">{{ songsStore.settings.appTitle }}</h1>
        </div>

        <div class="app-card-body">
          <div class="segmented" role="tablist">
            <button class="segmented-item active" id="vault-tab" data-bs-toggle="tab" data-bs-target="#vault"
              type="button" role="tab" aria-controls="vault" aria-selected="true">
              <i class="bi bi-box-seam-fill"></i> Vault
            </button>
            <button class="segmented-item" id="search-tab" data-bs-toggle="tab" data-bs-target="#search" type="button"
              role="tab" aria-controls="search" aria-selected="false">
              <i class="bi bi-search"></i> List
            </button>
            <button class="segmented-item" id="queue-tab" data-bs-toggle="tab" data-bs-target="#queue" type="button"
              role="tab" aria-controls="queue" aria-selected="false">
              <i class="bi bi-qr-code"></i> Requests
              <span v-if="songsStore.queue.length" class="tab-badge">{{ songsStore.queue.length }}</span>
            </button>
          </div>

          <div class="tab-content pt-4">
            <div class="tab-pane active" id="vault" role="tabpanel" aria-labelledby="vault-tab">
              <VaultComponent />
            </div>
            <div class="tab-pane" id="search" role="tabpanel" aria-labelledby="search-tab">
              <SearchComponent />
            </div>
            <div class="tab-pane" id="queue" role="tabpanel" aria-labelledby="queue-tab">
              <QueueComponent />
            </div>
          </div>
        </div>

        <div v-if="songsStore.settings.folders.length === 0" class="app-card-alert app-card-hint">
          <i class="bi bi-folder-plus"></i>
          Add a song folder in <span class="fw-semibold">Settings</span> to get started
        </div>
        <div v-else-if="songsStore.hasIssueFindingFolder" class="app-card-alert">
          <i class="bi bi-exclamation-triangle-fill"></i>
          Couldn't read: <span class="fw-semibold">{{ failedFolderNames }}</span>
        </div>
      </div>

      <div class="brand-footer">
        &copy; Proffictech {{ thisYear }} &middot; 08139590011
      </div>
    </div>
  </div>

  <playModal />
  <SettingsComponent />
</template>


<script setup lang="ts">
import playModal from '@/components/playModal.vue';
import VaultComponent from '@/components/vaultComponent.vue';
import SearchComponent from '@/components/searchComponent.vue';
import QueueComponent from '@/components/queueComponent.vue';
import { userSongsStore } from '@/stores/songsStore';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import SettingsComponent from '@/components/settingsComponent.vue';
import log from '@/log';

const songsStore = userSongsStore()

let unsubscribeSongsUpdated: (() => void) | null = null

function applySongsPayload(payload: { songs: string[]; failedFolders: string[] }) {
  songsStore.archive = payload.songs
  songsStore.failedFolders = payload.failedFolders
  songsStore.hasIssueFindingFolder = payload.failedFolders.length > 0
}

async function loadSongsInFolders() {
  try {
    //@ts-ignore
    // Spread into a plain array: a Vue-reactive array can fail to survive
    // Electron's structured-clone IPC serialization as a genuine Array.
    const payload = await window.electronAPI.readFolders([...songsStore.settings.folders])
    applySongsPayload(payload)
  } catch (error) {
    songsStore.hasIssueFindingFolder = true
    log.error('Failed to read song folders:', error)
  }
}

const failedFolderNames = computed(() =>
  songsStore.failedFolders.map((f) => f.split(/[\\/]/).pop()).join(', ')
)

watch(() => songsStore.settings.folders, () => {
  loadSongsInFolders()
}, { deep: true, immediate: true })

onMounted(() => {
  //@ts-ignore
  unsubscribeSongsUpdated = window.electronAPI.onSongsUpdated(applySongsPayload)
})

onUnmounted(() => {
  unsubscribeSongsUpdated?.()
})


const thisYear = ref(new Date().getFullYear())

</script>

<style scoped>
.stage {
  position: relative;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1rem;
  overflow: hidden;
}

.stage-content {
  max-height: 100%;
}

.stage-media {
  position: absolute;
  inset: 0;
  background-image: url('/kara1.jpg');
  background-size: cover;
  background-position: center;
  transform: scale(1.02);
}

.stage-scrim {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 15%, color-mix(in srgb, var(--theme-color) 30%, transparent), transparent 55%),
    linear-gradient(180deg, rgba(6, 3, 9, 0.92) 0%, rgba(6, 3, 9, 0.96) 60%, #060309 100%);
}

.stage-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.icon-fab {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--surface-border);
  background: var(--surface);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.icon-fab:hover {
  background: var(--surface-strong);
  border-color: var(--theme-color-bright);
  box-shadow: 0 0 16px var(--theme-glow);
  transform: translateY(-1px);
}

.settings-fab {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 5;
}

.app-card {
  width: 100%;
  background: #120a17;
  border: 2px solid var(--theme-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated),
    0 0 0 1px color-mix(in srgb, var(--theme-color) 40%, transparent),
    0 0 32px var(--theme-glow);
  overflow: hidden;
}

.app-card-header {
  padding: 2rem 1.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  align-self: flex-start;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.blink-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--theme-color-bright);
  box-shadow: 0 0 8px var(--theme-glow);
  animation: blink 1.4s ease-in-out infinite;
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.25;
  }
}

.app-title {
  font-size: 1.7rem;
  font-weight: 800;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-shadow: 0 0 18px var(--theme-glow), 0 0 2px color-mix(in srgb, var(--theme-color) 60%, transparent);
}

.app-card-body {
  padding: 1.25rem 1.5rem 1.5rem;
}

.segmented {
  display: flex;
  gap: 0.35rem;
  padding: 0.3rem;
  background: #000000;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
}

.segmented-item {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.78rem;
  padding: 0.6rem 0.5rem;
  border-radius: calc(var(--radius-md) - 0.3rem);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.segmented-item.active {
  background: var(--theme-color);
  color: #ffffff;
  box-shadow: 0 0 14px var(--theme-glow);
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: var(--theme-color-bright);
  color: #1c0a12;
  font-size: 0.65rem;
  font-weight: 800;
}

.app-card-alert {
  padding: 0.9rem 1.75rem;
  background: #2a0d13;
  border-top: 1px solid #dc3545;
  color: #ff9aa4;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.app-card-hint {
  background: var(--surface);
  border-top: 1px solid var(--surface-border);
  color: var(--text-muted);
}

.brand-footer {
  color: var(--text-faint);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-align: center;
}
</style>
