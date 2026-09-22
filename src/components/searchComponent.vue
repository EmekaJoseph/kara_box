<template>
    <div class="song-list">
        <div class="search-box">
            <i class="bi bi-search"></i>
            <input v-model="searchQuery" class="search-input" placeholder="Search songs&hellip;" type="text">
            <button v-if="searchQuery" @click="searchQuery = ''" class="search-clear" type="button"
                aria-label="Clear search">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>

        <div class="stage-box">
            <ul v-if="filteredItems.length" class="song-items">
                <li @click="songsStore.playSong(song)" v-for="song in filteredItems" :key="song" class="song-item">
                    <span class="song-item-icon"><i class="bi bi-play-fill"></i></span>
                    <span class="song-item-name">{{ songsStore.songName(song) }}</span>
                </li>
            </ul>
            <div v-else class="stage-placeholder">
                <i class="bi bi-vinyl-fill"></i>
                <p>No songs match your search</p>
            </div>
        </div>

        <div class="vault-meta">
            <span v-tooltip title="Total songs" class="count-pill">
                <i class="bi bi-collection-play"></i> {{ songsStore.archive.length }} total
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { userSongsStore } from "@/stores/songsStore";
import { computed, ref } from "vue";


const songsStore = userSongsStore();

const searchQuery = ref<string>("");

const filteredItems = computed(() => {
    const query = searchQuery.value.toLowerCase();
    return !query ? songsStore.archive : songsStore.archive.filter((item) =>
        item.toLowerCase().includes(query)
    );
});


</script>

<style scoped>
.song-list {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.search-box {
    position: relative;
    display: flex;
    align-items: center;
}

.search-box i {
    position: absolute;
    left: 0.9rem;
    color: var(--text-faint);
    font-size: 0.9rem;
}

.search-input {
    width: 100%;
    border: 1px solid var(--surface-border);
    background: #000000;
    color: var(--text-primary);
    border-radius: 999px;
    padding: 0.65rem 2.5rem;
    font-size: 0.9rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-input::placeholder {
    color: var(--text-faint);
}

.search-input:focus {
    border-color: var(--theme-color);
    box-shadow: 0 0 14px var(--theme-glow);
}

.search-clear {
    position: absolute;
    right: 0.75rem;
    border: none;
    background: transparent;
    color: var(--text-faint);
    font-size: 0.8rem;
    padding: 0.25rem;
    display: flex;
}

.search-clear:hover {
    color: var(--text-primary);
}

.stage-box {
    height: 220px;
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
}

.stage-placeholder i {
    font-size: 1.8rem;
}

.stage-placeholder p {
    font-size: 0.85rem;
}

.song-items {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.song-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.song-item:hover {
    background: var(--theme-color-soft);
}

.song-item-icon {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    color: var(--text-muted);
}

.song-item:hover .song-item-icon {
    background: var(--theme-color);
    color: #ffffff;
}

.song-item-name {
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.vault-meta {
    display: flex;
    justify-content: flex-end;
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
</style>
