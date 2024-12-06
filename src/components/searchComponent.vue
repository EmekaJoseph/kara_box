<template>
    <div class="row g-3">
        <div class="col-12">
            <input v-model="searchQuery" class="form-control form-control-lg bg-light" placeholder="search here.."
                type="text">
        </div>
        <div class="col-12">
            <div class="card content-bg p-2" style="overflow-y: auto;">
                <ul class="list-group list-group-flush">
                    <li @click="songsStore.playSong(song)" v-for="(song, idx) in filteredItems" :key="song"
                        class="list-group-item cursor-pointer bg-transparent">
                        <i class="bi bi-play-btn-fill"></i> {{ songsStore.songName(song) }}
                    </li>
                </ul>

            </div>
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
.loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
}

.list-group-item:hover {
    background-color: #f5f5e8;
    color: #3B214A;
    font-weight: bolder;
}
</style>