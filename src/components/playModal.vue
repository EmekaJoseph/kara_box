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
                            <i class="bi bi-disc-fill text-theme"></i>
                            {{ songsStore.songName(songsStore.selectedSong) }}
                        </h6>
                        <button @click="songsStore.isPlayingSong = false" ref="modalClose" type="button"
                            class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="isConverting" class="convert-status">
                            <div class="convert-spinner"></div>
                            <p>Converting for compatibility&hellip;</p>
                        </div>
                        <div v-else-if="conversionFailed" class="convert-status convert-error">
                            <i class="bi bi-exclamation-triangle-fill"></i>
                            <p>Couldn't play this video.</p>
                        </div>
                        <video v-else-if="songsStore.isPlayingSong" class="w-100 h-100" controls autoplay
                            :src="videoSrc" @error="handleVideoError">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <div class="modal-footer">
                        <input ref="fileBrowserBtn" type="file" class="d-none"
                            accept="video/mp4, video/webm, video/ogg" />
                        <button @click="openFolder" v-tooltip title="Browse for file" class="btn-icon">
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

const videoSrc = ref('')
const isConverting = ref(false)
const conversionFailed = ref(false)
// 0 = original file not yet tried converting, 1 = tried the fast
// stream-copy conversion, 2 = tried forcing a full re-encode.
const conversionAttempts = ref(0)

async function openFolder() {
    fileBrowserBtn.value.click()
}

async function handleVideoError() {
    if (isConverting.value || conversionFailed.value) return
    if (conversionAttempts.value >= 2) {
        conversionFailed.value = true
        return
    }

    const forceReencode = conversionAttempts.value === 1
    conversionAttempts.value++
    isConverting.value = true
    try {
        //@ts-ignore
        const convertedFileName = await window.electronAPI.convertVideo(songsStore.songsDir, songsStore.selectedSong, forceReencode)
        videoSrc.value = songsStore.songsDir + '.converted/' + convertedFileName
    } catch (error) {
        conversionFailed.value = true
        console.error('Video conversion failed:', error)
    } finally {
        isConverting.value = false
    }
}

watch(() => songsStore.playModal, () => {
    console.log(songsStore.playModal);

    modalOpen.value.click()
})

watch(() => songsStore.selectedSong, (song) => {
    if (!song) return
    conversionFailed.value = false
    conversionAttempts.value = 0
    videoSrc.value = songsStore.songsDir + song
})

onBeforeRouteLeave(() => {
    modalClose.value.click()
})

</script>

<style scoped>
.modal-content {
    background: #150d19;
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    overflow: hidden;
}

.modal-header {
    border-bottom: 1px solid var(--surface-border);
    padding: 1rem 1.25rem;
}

.modal-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
}

.modal-body {
    background: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}

.modal-footer {
    border-top: 1px solid var(--surface-border);
    padding: 0.75rem 1.25rem;
}

.btn-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid var(--surface-border);
    background: var(--surface);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;
}

.btn-icon:hover {
    background: var(--surface-strong);
}

:deep(.btn-close) {
    filter: invert(1) grayscale(100%) brightness(200%);
    opacity: 0.75;
}

:deep(.btn-close:hover) {
    opacity: 1;
}

.convert-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-muted);
    font-size: 0.9rem;
}

.convert-spinner {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 3px solid var(--surface-border);
    border-top-color: var(--theme-color);
    animation: convert-spin 0.8s linear infinite;
}

@keyframes convert-spin {
    to {
        transform: rotate(360deg);
    }
}

.convert-error {
    color: #ff8a93;
    font-size: 1.3rem;
}

.convert-error p {
    font-size: 0.9rem;
    color: var(--text-muted);
}
</style>
