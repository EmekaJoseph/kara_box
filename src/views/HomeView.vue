<template>
  <div class="min-vh-100 base-page" style="background-color:#3A2049;">
    <div @click="songsStore.settings.togglePanel = !songsStore.settings.togglePanel" class="settings-icon">
      <i class="bi bi-gear-fill"></i>
    </div>
    <div class="copy-right">
      &copy; Proffictech 2024
      <div class="text-center">08139590011</div>
    </div>
    <div class="container">

      <div class="row min-vh-100 justify-content-center align-items-center">
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm" style="min-height: 450px;">
            <div class="card-header border-0 fw-bold text-uppercase">
              {{ songsStore.settings.appTitle }}
              <div class="float-end text-muted small">
                <i class="bi bi-mic-fill"></i> KARAOKE BOX
              </div>
              <!-- <div class="float-end">
                <select class="form-select form-select-sm" v-model="songsStore.songsType">
                  <option value="all">All</option>
                  <option value="safe">Safe</option>
                </select>
              </div> -->
            </div>
            <div class="card-body">
              <ul class="nav nav-tabs" id="myTab" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active" id="vault-tab" data-bs-toggle="tab" data-bs-target="#vault"
                    type="button" role="tab" aria-controls="vault" aria-selected="true">
                    <i class="bi bi-box-seam-fill"></i>
                    Vault
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link" id="search-tab" data-bs-toggle="tab" data-bs-target="#search" type="button"
                    role="tab" aria-controls="search" aria-selected="false">
                    <i class="bi bi-search"></i>
                    List
                  </button>
                </li>

              </ul>
              <div class="tab-content p-3">
                <div class="tab-pane active" id="vault" role="tabpanel" aria-labelledby="vault-tab">
                  <VaultComponent />
                </div>
                <div class="tab-pane" id="search" role="tabpanel" aria-labelledby="search-tab">
                  <SearchComponent />
                </div>
              </div>
            </div>
            <div v-if="hasIssueFindingFolder" class="card-footer text-center text-danger bg-danger-subtle">
              Error finding folder: <span class="fw-bold">{{ songsStore.settings.folderName }}</span>
            </div>
          </div>
        </div>
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
import { userSongsStore } from '@/stores/songsStore';
import { ref, watchEffect } from 'vue';
import SettingsComponent from '@/components/settingsComponent.vue';

const songsStore = userSongsStore()

const hasIssueFindingFolder = ref<boolean>(false)


watchEffect(() => {
  loadSongsInFolder()
})

async function loadSongsInFolder() {
  try {
    //@ts-ignore
    const songs = await window.electronAPI.readFolder(songsStore.songsDir);
    songsStore.archive = songs
    hasIssueFindingFolder.value = false
  } catch (error) {
    hasIssueFindingFolder.value = true
  }
}

</script>

<style scoped>
.nav-link {
  color: var(--bs-text-muted);
  border: none;
  padding-inline: 30px !important;
}

.nav-link.active {
  font-weight: bold;
  border-bottom: 2px v-bind('songsStore.settings.themeColor') solid !important;
}

.tab-pane {
  min-height: 250px;
}


.base-page {
  background: url('/kara1.jpg');
  background-size: cover;
  background-position: center center;
}



.base-page::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.895);
  /* Tint color with opacity */
  z-index: 1;
  /* Keeps the tint above the background */
}

.base-page>* {
  position: relative;
  z-index: 2;
  /* Ensures content stays above the tint */
}


.copy-right {
  color: #ffffff;
  font-size: 11px;
  position: fixed;
  bottom: 0;
  right: 0;
  margin-right: 20px;
  margin-bottom: 20px;
}

.settings-icon {
  color: #ffffff;
  position: fixed;
  top: 0;
  left: 0;
  margin-left: 20px;
  margin-top: 20px;
  cursor: pointer;
}
</style>
