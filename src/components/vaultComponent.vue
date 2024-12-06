<template>
    <div class="row g-3">
        <div class="col-10">
            <button @click="getRandomSong" class="btn btn-theme btn-lg w-100">
                <i class="bi bi-arrow-repeat"></i> CLICK TO SPIN
            </button>
        </div>

        <div class="col-2">
            <button :disabled="songsStore.archive.length == vaultSongs.length" @click="resetShufle"
                class="btn btn-dark btn-lg w-100">
                <i class="bi bi-arrow-counterclockwise"></i>
            </button>
        </div>
        <div class="col-12">
            <div class="card content-bg d-flex justify-content-center align-items-center"
                :class="{ 'loading-spinner': isLoading }">
                <div v-html="resultText"></div>
                <button @click="songsStore.playSong(songsStore.selectedSong)"
                    v-if="songsStore.selectedSong && resultText" class="btn btn-play btn-sm p-0 px-3">
                    <i class="bi bi-play-fill"></i>
                </button>
            </div>
            <div class="float-end small">
                -{{ vaultSongs.length }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { userSongsStore } from "@/stores/songsStore";
import { ref, watch } from "vue";


const songsStore = userSongsStore();

const resultText = ref<string>("");
const isLoading = ref<boolean>(false);

const vaultSongs = ref<string[]>(songsStore.archive)


function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}


watch(() => songsStore.songsType, () => { resetVault() })

// Main Function
function getRandomSong(): void {
    songsStore.selectedSong = ''
    const shuffleDuration = 10; // duration in seconds
    let secondsLeft = shuffleDuration;

    isLoading.value = true;
    resultText.value = generateSpinnerHTML();

    const timer = setInterval(() => {
        secondsLeft--;

        if (secondsLeft === 0) {
            clearInterval(timer);
            isLoading.value = false;

            if (vaultSongs.value.length) {
                const randomSong = getRandomItem(vaultSongs.value);
                songsStore.selectedSong = randomSong;
                resultText.value = generateSuccessHTML(randomSong);

                // Remove the selected song from the archive
                vaultSongs.value = vaultSongs.value.filter((song) => song !== randomSong);
            } else {
                resultText.value = generateErrorHTML("End of Songs!");
            }
        }
    }, 200);
}

// Helper Functions for HTML Generation
function generateSpinnerHTML(): string {
    return `
      <div class="spinner-border text-warning" role="status" style="height: 60px; width: 60px;">
        <span class="visually-hidden">Loading...</span>
      </div>`;
}

function generateSuccessHTML(song: string): string {
    return `
      <div class="fs-2 fw-bold text-success-emphasis text-center">
        ${songsStore.songName(song)}
      </div>`;
}

function generateErrorHTML(message: string): string {
    return `
      <div class="fs-1 fw-bold text-danger-emphasis text-center">
        ${message}
      </div>`;
}

function resetVault() {
    songsStore.selectedSong = ''
    resultText.value = ''
    vaultSongs.value = [...songsStore.archive];
}

function resetShufle() {
    if (confirm('This will clear and re-shuffle all songs. Do you want to continue?')) {
        resetVault()
    }
}
</script>

<style scoped>
/* Add specific styles for spinner loading if needed */
.loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>