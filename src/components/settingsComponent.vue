<template>
    <button ref="settingsComponentOpen" class="d-none" type="button" data-bs-toggle="offcanvas"
        data-bs-target="#settingsComponent" aria-controls="settingsComponent">
    </button>

    <div class="offcanvas offcanvas-start border-0" tabindex="-1" id="settingsComponent"
        aria-labelledby="staticBackdropLabel">
        <div class="offcanvas-header">
            <h5 class="offcanvas-title " id="staticBackdropLabel">
                <i class="bi bi-gear-fill text-theme"></i> SETTINGS
            </h5>

            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">



            <form @submit.prevent class="row g-3">

                <div class="col-11">
                    <div class="form-floating">
                        <input v-model="form.app_title" type="text" class="form-control" id="app_title"
                            placeholder="" />
                        <label for="app_title">Title:</label>
                    </div>
                </div>
                <div class="col-11">
                    <div class="form-floating">
                        <input v-model="form.folder_name" type="text" class="form-control" id="folder_name"
                            placeholder="" />
                        <label for="folder_name">Folder:</label>
                    </div>
                    <div v-if="!isValidFoldername" class="small text-danger">
                        Must be only one word, no spaces. Only letters, numbers, underscores are allowed. It must not
                        start with a number and may end
                        with an underscore.
                    </div>
                </div>

                <div class="col-11">
                    <div class="card">
                        <div class="card-body py-3 d-flex justify-content-between small">
                            Theme (click to change):
                            <ColorPicker v-model:pureColor="form.theme_color" format="hex" shape="circle" blur-close
                                disable-alpha />
                        </div>
                    </div>
                </div>

                <div class="col-11 mt-5">
                    <div v-if="songsStore.hasIssueFindingFolder" class="text-danger">
                        <i class="bi bi-exclamation-circle-fill"></i> Cannot find folder: <span class="fw-bold">{{
                            songsStore.settings.folderName }}</span>
                    </div>
                </div>


                <!-- <div class="col-11 mt-4">
                    <button :disabled="!isValidFoldername" type="submit"
                        class="btn btn-theme btn-lg w-100">Save</button>
                </div> -->
            </form>
        </div>
        <div
            class="position-absolute bottom-0 bg-theme w-100 small d-flex justify-content-center align-items-center text-white-50">
            &copy; PROFFICTECH 2024.
        </div>

    </div>
</template>

<script setup lang="ts">
import { userSongsStore } from '@/stores/songsStore';
import { computed, reactive, ref, watch } from 'vue';

import { ColorPicker } from "vue3-colorpicker";
import "vue3-colorpicker/style.css";

const form = reactive({
    theme_color: '',
    folder_name: '',
    app_title: '',
})

const showAlert = ref(false);

const isValidFoldername = computed(() => {
    const regex = /^[a-zA-Z_][a-zA-Z0-9_]*_?$/;
    return regex.test(form.folder_name)
})

const songsStore = userSongsStore()

const settingsComponentOpen = ref<any>(null)

watch(() => songsStore.settings.togglePanel, () => {
    form.folder_name = songsStore.settings.folderName
    form.app_title = songsStore.settings.appTitle
    form.theme_color = songsStore.settings.themeColor
    showAlert.value = false;
    settingsComponentOpen.value.click()
})

watch(() => form, () => {
    songsStore.settings.folderName = form.folder_name
    songsStore.settings.appTitle = form.app_title
    songsStore.settings.themeColor = form.theme_color
    // handleAlert()
}, { deep: true })

// function saveSettings() {
//     songsStore.settings.folderName = form.folder_name
//     songsStore.settings.appTitle = form.app_title
//     songsStore.settings.themeColor = form.theme_color

// }


function handleAlert() {
    showAlert.value = true
    setTimeout(() => {
        showAlert.value = false;
    }, 1000);
}


</script>

<style scoped>
.form-control-color {
    width: 110px;
}
</style>