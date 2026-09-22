<template>
    <div class="vault">
        <div class="stage-box" :class="{ 'is-loading': pageParams.isLoading }">
            <div v-if="!pageParams.resultText" class="stage-placeholder">
                <i class="bi bi-shuffle"></i>
                <p>Press spin to discover your next song</p>
            </div>
            <div v-else v-html="pageParams.resultText"></div>
            <button @click="songsStore.playSong(songsStore.selectedSong)"
                v-if="songsStore.selectedSong && pageParams.resultText" v-tooltip title="Play this song"
                class="play-fab">
                <i class="bi bi-play-fill"></i>
            </button>
        </div>

        <div class="vault-actions">
            <button v-tooltip title="Spin to shuffle songs!" @click="getRandomSong" class="btn-spin"
                :class="{ spinning: pageParams.isLoading }">
                <i class="bi bi-arrow-repeat"></i> Spin
            </button>
            <span v-tooltip title="Number of songs left" class="count-pill">
                <i class="bi bi-music-note-list"></i> {{ pageParams.vaultSongs.length }} left
            </span>
            <button v-tooltip title="Reset all songs!"
                :disabled="songsStore.archive.length == pageParams.vaultSongs.length" @click="resetShufle"
                class="btn-reset">
                <i class="bi bi-arrow-counterclockwise"></i>
            </button>
        </div>
    </div>

    <Teleport to="body">
        <Transition name="confirm-fade">
            <div v-if="showResetConfirm" class="confirm-overlay" @click.self="showResetConfirm = false">
                <div class="confirm-dialog">
                    <div class="confirm-icon"><i class="bi bi-arrow-counterclockwise"></i></div>
                    <h3 class="confirm-title">Reshuffle the vault?</h3>
                    <p class="confirm-message">This will clear your progress and re-shuffle all songs.</p>
                    <div class="confirm-actions">
                        <button class="btn-cancel" @click="showResetConfirm = false">Cancel</button>
                        <button class="btn-confirm" @click="confirmReset">
                            <i class="bi bi-arrow-counterclockwise"></i> Reshuffle
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { userSongsStore } from "@/stores/songsStore";
import { reactive, ref, watch } from "vue";

const songsStore = userSongsStore();

const pageParams = reactive<{ resultText: string, isLoading: boolean, vaultSongs: string[] }>({
    resultText: "",
    isLoading: false,
    vaultSongs: [],
})

const showResetConfirm = ref(false)


watch(() => songsStore.archive, () => {
    pageParams.vaultSongs = songsStore.archive
})

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}


// Main Function
function getRandomSong(): void {
    songsStore.selectedSong = ''
    const shuffleDuration = 10; // duration in seconds
    let secondsLeft = shuffleDuration;

    pageParams.isLoading = true;
    pageParams.resultText = generateSpinnerHTML();

    const timer = setInterval(() => {
        secondsLeft--;

        if (secondsLeft === 0) {
            clearInterval(timer);
            pageParams.isLoading = false;

            if (pageParams.vaultSongs.length) {
                const randomSong = getRandomItem(pageParams.vaultSongs);
                songsStore.selectedSong = randomSong;
                pageParams.resultText = generateSuccessHTML(randomSong);

                // Remove the selected song from the archive
                pageParams.vaultSongs = pageParams.vaultSongs.filter((song) => song !== randomSong);
            } else {
                pageParams.resultText = generateErrorHTML("End of Songs!");
            }
        }
    }, 200);
}

// Helper Functions for HTML Generation
function generateSpinnerHTML(): string {
    return `
      <div class="reveal-spinner" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="reveal-caption">Shuffling&hellip;</p>`;
}

function generateSuccessHTML(song: string): string {
    return `
      <div class="reveal-title">
        ${songsStore.songName(song)}
      </div>`;
}

function generateErrorHTML(message: string): string {
    return `
      <div class="reveal-error">
        <i class="bi bi-flag-fill"></i> ${message}
      </div>`;
}

function resetVault() {
    songsStore.selectedSong = ''
    pageParams.resultText = ''
    pageParams.vaultSongs = [...songsStore.archive];
}

function resetShufle() {
    showResetConfirm.value = true
}

function confirmReset() {
    showResetConfirm.value = false
    resetVault()
}
</script>

<style scoped>
.vault {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.stage-box {
    position: relative;
    min-height: 200px;
    border-radius: var(--radius-md);
    background: #000000;
    border: 2px dashed var(--surface-border);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1.5rem 3.5rem 1.5rem 1.5rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.stage-box.is-loading {
    border-style: solid;
    border-color: var(--theme-color);
    box-shadow: 0 0 24px var(--theme-glow) inset;
}

.stage-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    color: var(--text-faint);
}

.stage-placeholder i {
    font-size: 1.8rem;
}

.stage-placeholder p {
    font-size: 0.85rem;
    max-width: 220px;
}

.play-fab {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid var(--theme-color-bright);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    box-shadow: 0 0 18px var(--theme-glow);
}

.count-pill {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    white-space: nowrap;
    gap: 0.4rem;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--theme-color);
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
}

.vault-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.btn-spin {
    flex: 1;
    border: 2px solid color-mix(in srgb, var(--theme-color) 60%, white 40%);
    border-radius: var(--radius-sm);
    background: var(--theme-color);
    color: #ffffff;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    font-size: 0.85rem;
    padding: 0.85rem 1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    box-shadow: 0 10px 24px -6px rgba(0, 0, 0, 0.7),
        0 0 20px var(--theme-glow),
        inset 0 1px 0 rgba(255, 255, 255, 0.25);
    transition: background-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
}

.btn-spin:hover {
    background: var(--theme-color-strong);
    box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.75),
        0 0 28px var(--theme-glow),
        inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.btn-spin:active {
    transform: scale(0.98);
}

.btn-spin.spinning i {
    animation: spin-icon 0.6s linear infinite;
}

.btn-reset {
    width: 52px;
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-primary);
    font-size: 1rem;
    transition: background-color 0.15s ease, opacity 0.15s ease;
}

.btn-reset:hover:not(:disabled) {
    background: var(--surface-strong);
}

.btn-reset:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

@keyframes spin-icon {
    to {
        transform: rotate(360deg);
    }
}

:deep(.reveal-spinner) {
    width: 42px;
    height: 42px;
    margin: 0 auto 0.75rem;
    border-radius: 50%;
    border: 3px solid var(--surface-border);
    border-top-color: var(--theme-color);
    animation: spin-icon 0.8s linear infinite;
}

:deep(.reveal-caption) {
    color: var(--text-muted);
    font-size: 0.85rem;
}

:deep(.reveal-title) {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--text-primary);
    text-align: center;
    text-shadow: 0 0 20px var(--theme-glow);
}

:deep(.reveal-error) {
    font-size: 1.1rem;
    font-weight: 700;
    color: #ff8a93;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.confirm-overlay {
    position: fixed;
    inset: 0;
    z-index: 1080;
    background: rgba(0, 0, 0, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
}

.confirm-dialog {
    width: 100%;
    max-width: 340px;
    background: #120a17;
    border: 2px solid var(--theme-color);
    border-radius: var(--radius-lg);
    box-shadow: 0 24px 70px -24px rgba(0, 0, 0, 0.8),
        0 0 40px var(--theme-glow);
    padding: 1.75rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
}

.confirm-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 2px solid var(--theme-color-bright);
    box-shadow: 0 0 20px var(--theme-glow);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    color: var(--text-primary);
    margin-bottom: 0.4rem;
}

.confirm-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.confirm-message {
    font-size: 0.85rem;
    color: var(--text-muted);
}

.confirm-actions {
    display: flex;
    gap: 0.6rem;
    width: 100%;
    margin-top: 0.75rem;
}

.btn-cancel {
    flex: 1;
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-primary);
    font-weight: 600;
    font-size: 0.85rem;
    padding: 0.65rem 1rem;
    transition: background-color 0.15s ease;
}

.btn-cancel:hover {
    background: var(--surface-strong);
}

.btn-confirm {
    flex: 1;
    border: 2px solid color-mix(in srgb, var(--theme-color) 60%, white 40%);
    border-radius: var(--radius-sm);
    background: var(--theme-color);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 0.65rem 1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    box-shadow: 0 0 16px var(--theme-glow);
    transition: background-color 0.15s ease;
}

.btn-confirm:hover {
    background: var(--theme-color-strong);
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
    transition: opacity 0.15s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
    opacity: 0;
}
</style>
