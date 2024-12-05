<template>
  <div class="min-vh-100 bg-warning-subtle">
    <div class="container">

      <div class="row min-vh-100 justify-content-center align-items-center">
        <div class="col-lg-7">
          <div class="text-center fw-bolder" style="font-size: 2.3rem;">
            KARAOKE BOX
          </div>
          <div class="card border-0 shadow-sm" style="min-height: 450px;">
            <div class="card-body">
              <!-- Nav tabs -->
              <ul class="nav nav-tabs" id="myTab" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active" id="vault-tab" data-bs-toggle="tab" data-bs-target="#vault"
                    type="button" role="tab" aria-controls="vault" aria-selected="true">
                    <i class="bi bi-box-seam-fill"></i> Vault
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link" id="search-tab" data-bs-toggle="tab" data-bs-target="#search" type="button"
                    role="tab" aria-controls="search" aria-selected="false">
                    <i class="bi bi-search"></i> Search
                  </button>
                </li>
              </ul>

              <!-- Tab panes -->
              <div class="tab-content py-3">
                <div class="tab-pane active" id="vault" role="tabpanel" aria-labelledby="vault-tab">
                  <div class="row g-3">
                    <div class="col-12">
                      <button @click="getRandomSong" class="btn btn-primary btn-lg w-100">
                        <i class="bi bi-shuffle"></i> SUFFLE SONGS
                      </button>
                    </div>
                    <div class="col-12">
                      <div class="card bg-light-subtle d-flex justify-content-center align-items-center"
                        v-html="resultText" style="min-height: 200px;">
                      </div>
                    </div>
                  </div>
                </div>
                <div class="tab-pane" id="search" role="tabpanel" aria-labelledby="search-tab">
                  Search
                </div>
              </div>

            </div>
            <div class="card-footer border-0 bg-transparent">
              <button @click="songsStore.playModal = !songsStore.playModal" v-if="songsStore.selectedSong"
                class="btn btn-success btn-lg w-100">
                <i class="bi bi-play"></i> PLAY
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <playModal />
</template>


<script setup lang="ts">
import { userSongsStore } from '@/stores/songsStore';
import { ref } from 'vue';
import playModal from '@/components/playModal.vue';

const songsStore = userSongsStore()

const resultText = ref<string>('')

function getRandomItem(arr: any) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}


function getRandomSong() {
  let seconds = 10;

  resultText.value = `<div style="height:60px; width: 60px" class="spinner-border text-danger" role="status"></div>`;
  const timer = setInterval(function () {
    seconds--;
    // resultText.innerHTML = seconds;
    if (seconds === 0) {
      clearInterval(timer);
      const randomSong = getRandomItem(songsStore.songsArchive);
      songsStore.selectedSong = randomSong
      resultText.value = `<div class="fs-1 fw-bold fw-700 text-danger-emphasis text-center">${randomSong}</div>`;


      // update the array:
      // const newarray = songsStore.songsArchive.filter(song => song !== randomSong);
      // songsStore.songsArchive = newarray
    }
  }, 200);
}




</script>

<style>
/* .video-player {
  width: 100%;

} */
</style>
