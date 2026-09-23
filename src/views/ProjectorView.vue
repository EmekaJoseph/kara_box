<template>
    <div class="projector-stage">
        <video v-if="videoSrc" ref="videoEl" :src="videoSrc" autoplay class="projector-video" @error="handleVideoError"
            @timeupdate="reportState()" @loadedmetadata="onLoadedMetadata" @play="reportState()"
            @pause="reportState()" @ended="reportState()"></video>
        <div v-else class="projector-idle">
            <span class="idle-eyebrow"><i class="bi bi-mic-fill"></i> Karaoke Box <span class="blink-dot"></span></span>
            <h1 class="idle-title">{{ songsStore.settings.appTitle }}</h1>
            <p class="idle-caption">Ready for the next song</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { userSongsStore } from '@/stores/songsStore';
import log from '@/log';
import { onMounted, onUnmounted, ref } from 'vue';

const songsStore = userSongsStore();

const videoEl = ref<HTMLVideoElement | null>(null);
const videoSrc = ref('');
const currentSong = ref('');
const conversionAttempts = ref(0);
const pendingVolume = ref(1);

let unsubscribeCommand: (() => void) | null = null;

onMounted(() => {
    //@ts-ignore
    unsubscribeCommand = window.electronAPI.onProjectorCommand(handleCommand);
});

onUnmounted(() => {
    unsubscribeCommand?.();
});

function handleCommand(command: any) {
    switch (command.type) {
        case 'load':
            currentSong.value = command.song;
            conversionAttempts.value = 0;
            pendingVolume.value = typeof command.volume === 'number' ? command.volume : 1;
            videoSrc.value = songsStore.toFileUrl(command.song);
            break;
        case 'play':
            videoEl.value?.play();
            break;
        case 'pause':
            videoEl.value?.pause();
            break;
        case 'seek':
            if (videoEl.value) videoEl.value.currentTime = command.time;
            break;
        case 'volume':
            if (videoEl.value) videoEl.value.volume = command.value;
            break;
        case 'stop':
            videoSrc.value = '';
            currentSong.value = '';
            break;
    }
}

function onLoadedMetadata() {
    if (videoEl.value) videoEl.value.volume = pendingVolume.value;
    reportState();
}

async function handleVideoError() {
    if (conversionAttempts.value >= 2 || !currentSong.value) {
        reportState(true);
        return;
    }

    const forceReencode = conversionAttempts.value === 1;
    conversionAttempts.value++;
    try {
        //@ts-ignore
        const convertedPath = await window.electronAPI.convertVideo(currentSong.value, forceReencode);
        videoSrc.value = songsStore.toFileUrl(convertedPath);
    } catch (error) {
        log.error('Projector video conversion failed:', error);
        reportState(true);
    }
}

function reportState(hasError = false) {
    const el = videoEl.value;
    //@ts-ignore
    window.electronAPI.reportProjectorState({
        currentTime: el?.currentTime ?? 0,
        duration: el?.duration ?? 0,
        paused: el?.paused ?? true,
        ended: el?.ended ?? false,
        error: hasError,
    });
}
</script>

<style scoped>
.projector-stage {
    position: fixed;
    inset: 0;
    background: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.projector-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.projector-idle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    text-align: center;
}

.idle-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-muted);
}

.blink-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--theme-color-bright);
    box-shadow: 0 0 14px var(--theme-glow);
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

.idle-title {
    font-size: 3.5rem;
    font-weight: 800;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-shadow: 0 0 40px var(--theme-glow), 0 0 4px color-mix(in srgb, var(--theme-color) 60%, transparent);
}

.idle-caption {
    font-size: 1.1rem;
    color: var(--text-faint);
}
</style>
