<template>
    <div>
        <!-- Modal trigger button -->
        <button type="button" ref="modalOpen d-none" class="" data-bs-toggle="modal" data-bs-target="#modalId">
            Launch
        </button>

        <!-- Modal Body -->
        <!-- if you want to close by clicking outside the modal, delete the last endpoint:data-bs-backdrop and data-bs-keyboard -->
        <div class="modal fade" id="modalId" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false"
            role="dialog" aria-labelledby="modalTitleId" aria-hidden="true">
            <div class="modal-dialog  modal-dialog-centered modal-dialog-scrollable modal-xl" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalTitleId">
                            &nbsp;
                        </h5>
                        <button ref="modalClose" type="button" class="btn-close" data-bs-dismiss="modal"
                            aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <video-player class="w-100" src="/videos/Shout To The Lord .mp4" controls :loop="true"
                            :volume="0.6" />
                    </div>
                    <!-- <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Close
                        </button>
                        <button type="button" class="btn btn-primary">Save</button>
                    </div> -->
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
    modalOpen.value.click()
})

onBeforeRouteLeave(() => {
    modalClose.value.click
})

</script>