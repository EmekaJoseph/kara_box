<template>
    <div>

        <button type="button" ref="modalOpen" class="d-none" data-bs-toggle="modal" data-bs-target="#modalId">
            Launch
        </button>


        <div class="modal fade" id="modalId" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false"
            role="dialog" aria-labelledby="modalTitleId" aria-hidden="true">
            <div class="modal-dialog  modal-dialog-centere modal-dialog-scrollable" role="document">
                <div class="modal-content" style="height: 70vh;">
                    <div class="modal-header">
                        <h6 class="modal-title" id="modalTitleId">
                            {{ songsStore.songName(songsStore.selectedSong) }}
                        </h6>
                        <button @click="songsStore.isPlayingSong = false" ref="modalClose" type="button"
                            class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <video v-if="songsStore.isPlayingSong" class="w-100 h-100" controls autoplay>
                            <source :src="songsStore.songsDir + songsStore.selectedSong" type="video/mp4">
                            <source :src="songsStore.songsDir + songsStore.selectedSong" type="video/ogg">
                            <source :src="songsStore.songsDir + songsStore.selectedSong" type="video/webm">
                            <source :src="songsStore.songsDir + songsStore.selectedSong" type="video/mkv">
                            <source :src="songsStore.songsDir + songsStore.selectedSong" type="video/avi">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <div class="modal-footer">
                        <input ref="fileBrowserBtn" type="file" class="d-none"
                            accept="video/mp4, video/webm, video/ogg" />
                        <button @click="openFolder" class="btn btn-theme btn-sm">
                            <i class="bi bi-folder-fill"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { userSongsStore } from '@/stores/songsStore';
import { ref, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

const modalOpen = ref<any>(null)
const modalClose = ref<any>(null)
const songsStore = userSongsStore()

const fileBrowserBtn = ref<any>(null)

async function openFolder() {
    fileBrowserBtn.value.click()
}


watch(() => songsStore.playModal, () => {
    console.log(songsStore.playModal);

    modalOpen.value.click()
})

onBeforeRouteLeave(() => {
    modalClose.value.click()
})

</script>