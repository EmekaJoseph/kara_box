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
                        <button @click="closeModal" ref="modalClose" type="button" class="btn-close"
                            data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="isProjectorActive" class="remote">
                            <div class="remote-projecting">
                                <i class="bi bi-display-fill"></i> Playing on second screen
                            </div>

                            <button type="button" class="remote-play" @click="toggleRemotePlayback">
                                <i :class="remoteState.paused ? 'bi bi-play-fill' : 'bi bi-pause-fill'"></i>
                            </button>

                            <div class="remote-seek">
                                <span class="remote-time">{{ formatTime(seekPosition) }}</span>
                                <input type="range" class="seek-bar" min="0" :max="remoteState.duration || 0"
                                    step="0.1" v-model.number="seekPosition" @input="onSeekInput"
                                    @change="onSeekChange" />
                                <span class="remote-time">{{ formatTime(remoteState.duration) }}</span>
                            </div>

                            <div class="remote-volume">
                                <i class="bi bi-volume-up-fill"></i>
                                <input type="range" class="volume-bar" min="0" max="1" step="0.05" v-model.number="volume"
                                    @input="onVolumeChange" />
                            </div>

                            <p v-if="remoteState.error" class="remote-error">
                                <i class="bi bi-exclamation-triangle-fill"></i> Couldn't play this video.
                            </p>
                        </div>
                        <div v-else-if="isConverting" class="convert-status">
                            <div class="convert-spinner"></div>
                            <p>Converting for compatibility&hellip;</p>
                        </div>
                        <div v-else-if="conversionFailed" class="convert-status convert-error">
                            <i class="bi bi-exclamation-triangle-fill"></i>
                            <p>Couldn't play this video.</p>
                        </div>
                        <video v-else-if="songsStore.isPlayingSong" ref="inlineVideoEl" class="w-100 h-100" controls
                            autoplay :src="videoSrc" @error="handleVideoError" @loadedmetadata="applyPendingVolume">
                            Your browser does not support the video tag.
                        </video>

                        <pitchMeterBar :show="songsStore.isPlayingSong" />
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
import log from '@/log';
import pitchMeterBar from '@/components/pitchMeterBar.vue';
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

const modalOpen = ref<any>(null)
const modalClose = ref<any>(null)
const inlineVideoEl = ref<HTMLVideoElement | null>(null)
const songsStore = userSongsStore()

const fileBrowserBtn = ref<any>(null)

const videoSrc = ref('')
const isConverting = ref(false)
const conversionFailed = ref(false)
// 0 = original file not yet tried converting, 1 = tried the fast
// stream-copy conversion, 2 = tried forcing a full re-encode.
const conversionAttempts = ref(0)
const pendingVolume = ref(1)

const isProjectorActive = ref(false)
const remoteState = reactive({ currentTime: 0, duration: 0, paused: true, ended: false, error: false })
const seekPosition = ref(0)
const isDragging = ref(false)
const volume = ref(1)

let unsubscribeProjectorStatus: (() => void) | null = null
let unsubscribeProjectorState: (() => void) | null = null

onMounted(async () => {
    try {
        //@ts-ignore
        isProjectorActive.value = await window.electronAPI.getProjectorStatus()
    } catch (error) {
        log.error('Failed to get projector status:', error)
    }
    //@ts-ignore
    unsubscribeProjectorStatus = window.electronAPI.onProjectorStatus((active: boolean) => {
        isProjectorActive.value = active
    })
    //@ts-ignore
    unsubscribeProjectorState = window.electronAPI.onProjectorState((state: typeof remoteState) => {
        Object.assign(remoteState, state)
    })
})

onUnmounted(() => {
    unsubscribeProjectorStatus?.()
    unsubscribeProjectorState?.()
})

watch(() => remoteState.currentTime, (t) => {
    if (!isDragging.value) seekPosition.value = t
})

function formatTime(seconds: number): string {
    if (!seconds || !Number.isFinite(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
}

function onSeekInput() {
    isDragging.value = true
}

function onSeekChange() {
    //@ts-ignore
    window.electronAPI.sendProjectorCommand({ type: 'seek', time: seekPosition.value })
    isDragging.value = false
}

function onVolumeChange() {
    //@ts-ignore
    window.electronAPI.sendProjectorCommand({ type: 'volume', value: volume.value })
}

function toggleRemotePlayback() {
    //@ts-ignore
    window.electronAPI.sendProjectorCommand({ type: remoteState.paused ? 'play' : 'pause' })
}

function applyPendingVolume() {
    if (inlineVideoEl.value) {
        inlineVideoEl.value.volume = pendingVolume.value
    }
}

async function fetchVolumeLevel(song: string): Promise<number> {
    try {
        //@ts-ignore
        return await window.electronAPI.getVolumeLevel(song)
    } catch (error) {
        log.error('Failed to get volume level:', error)
        return 1
    }
}

async function loadOnProjector(song: string) {
    remoteState.error = false
    const initialVolume = await fetchVolumeLevel(song)
    volume.value = initialVolume
    //@ts-ignore
    window.electronAPI.sendProjectorCommand({
        type: 'load',
        song,
        title: songsStore.songName(song),
        volume: initialVolume,
    })
}

async function loadInline(song: string) {
    pendingVolume.value = await fetchVolumeLevel(song)
    videoSrc.value = songsStore.toFileUrl(song)
}

function closeModal() {
    songsStore.isPlayingSong = false
    if (isProjectorActive.value) {
        //@ts-ignore
        window.electronAPI.sendProjectorCommand({ type: 'stop' })
    }
}

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
        const convertedPath = await window.electronAPI.convertVideo(songsStore.selectedSong, forceReencode)
        videoSrc.value = songsStore.toFileUrl(convertedPath)
    } catch (error) {
        conversionFailed.value = true
        log.error('Video conversion failed:', error)
    } finally {
        isConverting.value = false
    }
}

watch(() => songsStore.playModal, () => {
    modalOpen.value.click()
})

watch(() => songsStore.selectedSong, (song) => {
    if (!song) return
    conversionFailed.value = false
    conversionAttempts.value = 0
    if (isProjectorActive.value) {
        loadOnProjector(song)
    } else {
        loadInline(song)
    }
})

// If a projector connects/disconnects mid-session, hand the current song
// off to wherever playback should now happen, resuming from the last known
// position rather than losing the moment entirely.
watch(isProjectorActive, (active) => {
    if (!songsStore.isPlayingSong || !songsStore.selectedSong) return
    if (active) {
        loadOnProjector(songsStore.selectedSong)
    } else {
        loadInline(songsStore.selectedSong)
    }
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
    position: relative;
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

.remote {
    width: 100%;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
}

.remote-projecting {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.9rem;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--theme-color);
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
}

.remote-play {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 2px solid var(--theme-color-bright);
    background: var(--theme-color);
    color: #ffffff;
    font-size: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 24px var(--theme-glow);
}

.remote-seek {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.remote-time {
    font-size: 0.75rem;
    color: var(--text-faint);
    min-width: 2.5rem;
    text-align: center;
}

.seek-bar,
.volume-bar {
    flex: 1;
    accent-color: var(--theme-color);
}

.remote-volume {
    width: 100%;
    max-width: 220px;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--text-muted);
}

.remote-error {
    color: #ff8a93;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
</style>
