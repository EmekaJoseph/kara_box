<template>
    <button ref="settingsComponentOpen" class="d-none" type="button" data-bs-toggle="offcanvas"
        data-bs-target="#settingsComponent" aria-controls="settingsComponent">
    </button>

    <div class="offcanvas offcanvas-start border-0 settings-panel" tabindex="-1" id="settingsComponent"
        aria-labelledby="staticBackdropLabel">
        <div class="offcanvas-header">
            <h5 class="offcanvas-title" id="staticBackdropLabel">
                <i class="bi bi-gear-fill text-theme"></i> Settings
            </h5>

            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">

            <form @submit.prevent class="settings-form">

                <div class="settings-section">
                    <span class="settings-label">General</span>

                    <div class="field-group">
                        <label for="app_title">Title</label>
                        <input v-model="form.app_title" type="text" class="field-input" id="app_title" />
                    </div>

                    <div class="field-group">
                        <label for="folder_name">Folder</label>
                        <input v-model="form.folder_name" type="text" class="field-input" id="folder_name" />
                        <div v-if="!isValidFoldername" class="field-hint text-danger">
                            Must be only one word, no spaces. Only letters, numbers, underscores are allowed. It must
                            not start with a number and may end with an underscore.
                        </div>
                        <div v-if="songsStore.hasIssueFindingFolder" class="field-hint text-danger">
                            <i class="bi bi-exclamation-circle-fill"></i> Cannot find folder: <span
                                class="fw-bold">{{ songsStore.settings.folderName }}</span>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <span class="settings-label">Appearance</span>

                    <div class="theme-row">
                        <div class="theme-row-text">
                            <span>Accent color</span>
                            <small>Used across buttons and highlights</small>
                        </div>
                        <ColorPicker v-model:pureColor="form.theme_color" format="hex" shape="circle" blur-close
                            disable-alpha />
                    </div>
                </div>

            </form>
        </div>
        <div class="settings-footer">
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
.settings-panel {
    background: #150d19;
    color: var(--text-primary);
    width: 320px;
}

.offcanvas-header {
    border-bottom: 1px solid var(--surface-border);
    padding: 1.25rem 1.5rem;
}

.offcanvas-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
}

:deep(.btn-close) {
    filter: invert(1) grayscale(100%) brightness(200%);
    opacity: 0.75;
}

:deep(.btn-close:hover) {
    opacity: 1;
}

.offcanvas-body {
    padding: 1.5rem;
}

.settings-form {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
}

.settings-section {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.settings-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-faint);
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.field-group label {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-weight: 600;
}

.field-input {
    border: 1px solid var(--surface-border);
    background: #000000;
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    padding: 0.6rem 0.85rem;
    font-size: 0.9rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.field-input:focus {
    border-color: var(--theme-color);
    box-shadow: 0 0 12px var(--theme-glow);
}

.field-hint {
    font-size: 0.75rem;
}

.theme-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem 1rem;
    border-radius: var(--radius-md);
    background: var(--surface);
    border: 1px solid var(--surface-border);
}

.theme-row-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.theme-row-text span {
    font-size: 0.85rem;
    font-weight: 600;
}

.theme-row-text small {
    color: var(--text-faint);
    font-size: 0.72rem;
}

.settings-footer {
    padding: 0.85rem 1.5rem;
    border-top: 1px solid var(--surface-border);
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    color: var(--text-faint);
    text-align: center;
}
</style>
