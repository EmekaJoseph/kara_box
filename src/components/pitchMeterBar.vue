<template>
    <div v-if="show" class="pitch-meter">
        <div class="pitch-track">
            <div class="pitch-fill" :style="{ transform: `scaleY(${level})` }"></div>
            <div class="pitch-puck" :style="{ bottom: `${level * 100}%` }"></div>
        </div>
        <p v-if="error" class="pitch-error" v-tooltip :title="error">
            <i class="bi bi-mic-mute-fill"></i>
        </p>
        <i v-else class="bi bi-mic-fill pitch-icon"></i>
    </div>
</template>

<script setup lang="ts">
import { usePitchMeter } from '@/composables/usePitchMeter';
import { watch } from 'vue';

const props = defineProps<{ show: boolean }>()
const { level, error, start, stop } = usePitchMeter()

watch(() => props.show, (show) => {
    if (show) start()
    else stop()
}, { immediate: true })
</script>

<style scoped>
.pitch-meter {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.pitch-track {
    position: relative;
    width: 14px;
    height: 140px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--surface-border);
    overflow: hidden;
}

.pitch-fill {
    position: absolute;
    inset: 0;
    transform-origin: bottom;
    background: linear-gradient(180deg, var(--theme-color-bright), var(--theme-color));
    box-shadow: 0 0 12px var(--theme-glow);
}

.pitch-puck {
    position: absolute;
    left: 50%;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--theme-color-bright);
    box-shadow: 0 0 14px var(--theme-glow);
    transform: translate(-50%, 50%);
}

.pitch-icon,
.pitch-error {
    font-size: 0.85rem;
    color: var(--text-faint);
}

.pitch-error {
    color: #ff8a93;
    cursor: default;
}
</style>
