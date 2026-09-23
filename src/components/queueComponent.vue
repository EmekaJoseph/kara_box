<template>
    <div class="queue">
        <div class="stage-box">
            <ul v-if="songsStore.queue.length" class="queue-items">
                <li v-for="item in songsStore.queue" :key="item.id" class="queue-item">
                    <div class="queue-item-info">
                        <span class="queue-item-song">{{ songsStore.songName(item.song) }}</span>
                        <span class="queue-item-name">requested by {{ item.name }}</span>
                    </div>
                    <div class="queue-item-actions">
                        <button v-tooltip title="Play now" @click="playRequest(item)" class="queue-play">
                            <i class="bi bi-play-fill"></i>
                        </button>
                        <button v-tooltip title="Remove request" @click="removeRequest(item.id)" class="queue-remove">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </li>
            </ul>
            <div v-else class="stage-placeholder">
                <i class="bi bi-qr-code"></i>
                <p>No requests yet &mdash; share the QR code in Settings so guests can add songs</p>
            </div>
        </div>

        <div class="vault-meta">
            <span v-tooltip title="Pending requests" class="count-pill">
                <i class="bi bi-people-fill"></i> {{ songsStore.queue.length }} waiting
            </span>
            <button v-if="songsStore.queue.length" v-tooltip title="Clear all requests" @click="clearQueue"
                class="btn-clear">
                <i class="bi bi-trash3-fill"></i> Clear
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { userSongsStore, type QueueRequest } from "@/stores/songsStore";
import { onMounted, onUnmounted } from "vue";

const songsStore = userSongsStore();

let unsubscribe: (() => void) | null = null;

onMounted(async () => {
    try {
        //@ts-ignore
        songsStore.queue = await window.electronAPI.queueGet();
        //@ts-ignore
        unsubscribe = window.electronAPI.onQueueUpdated((queue: QueueRequest[]) => {
            songsStore.queue = queue;
        });
    } catch (error) {
        console.error('Failed to load request queue:', error);
    }
});

onUnmounted(() => {
    unsubscribe?.();
});

function playRequest(item: QueueRequest) {
    songsStore.playSong(item.song);
    //@ts-ignore
    window.electronAPI.queueRemove(item.id);
}

function removeRequest(id: string) {
    //@ts-ignore
    window.electronAPI.queueRemove(id);
}

function clearQueue() {
    if (confirm('Clear all pending song requests?')) {
        //@ts-ignore
        window.electronAPI.queueClear();
    }
}
</script>

<style scoped>
.queue {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.stage-box {
    height: 260px;
    overflow-y: auto;
    border-radius: var(--radius-md);
    background: #000000;
    border: 1px solid var(--surface-border);
    padding: 0.5rem;
}

.stage-placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    color: var(--text-faint);
    text-align: center;
    padding: 1.5rem;
}

.stage-placeholder i {
    font-size: 1.8rem;
}

.stage-placeholder p {
    font-size: 0.85rem;
}

.queue-items {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.queue-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius-sm);
    background: var(--surface);
    border: 1px solid var(--surface-border);
}

.queue-item-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.queue-item-song {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.queue-item-name {
    font-size: 0.72rem;
    color: var(--text-faint);
}

.queue-item-actions {
    display: flex;
    gap: 0.4rem;
    flex-shrink: 0;
}

.queue-play,
.queue-remove {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    border: 1px solid var(--surface-border);
    background: var(--surface);
    color: var(--text-primary);
}

.queue-play {
    border-color: var(--theme-color-bright);
    box-shadow: 0 0 12px var(--theme-glow);
}

.queue-remove:hover {
    background: var(--surface-strong);
}

.vault-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
}

.count-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--theme-color);
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
}

.btn-clear {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.4rem 0.7rem;
}

.btn-clear:hover {
    background: var(--surface-strong);
    color: var(--text-primary);
}
</style>
