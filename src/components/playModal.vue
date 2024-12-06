<template>
    <div>

        <button type="button" ref="modalOpen" class="d-none" data-bs-toggle="modal" data-bs-target="#modalId">
            Launch
        </button>


        <div class="modal fade" id="modalId" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false"
            role="dialog" aria-labelledby="modalTitleId" aria-hidden="true">
            <div class="modal-dialog  modal-dialog-centere modal-dialog-scrollabl" role="document">
                <div class="modal-content" style="height: 70vh;">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalTitleId">
                            {{ songsStore.songName(songsStore.selectedSong) }}
                        </h5>
                        <button @click="songsStore.isPlayingSong = false" ref="modalClose" type="button"
                            class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <video-player v-if="songsStore.isPlayingSong" class="w-100 h-100"
                            :src="'/videos/' + songsStore.selectedSong" controls :loop="true" :volume="0.6" />
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

import { VideoPlayer } from '@videojs-player/vue'
import 'video.js/dist/video-js.css'


const modalOpen = ref<any>(null)
const modalClose = ref<any>(null)
const songsStore = userSongsStore()


watch(() => songsStore.playModal, () => {
    console.log(songsStore.playModal);

    modalOpen.value.click()
})

onBeforeRouteLeave(() => {
    modalClose.value.click()
})

</script>