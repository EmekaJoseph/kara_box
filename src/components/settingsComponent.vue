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
                        <label>Song folders</label>
                        <ul v-if="songsStore.settings.folders.length" class="folder-list">
                            <li v-for="folder in songsStore.settings.folders" :key="folder" class="folder-item">
                                <span class="folder-item-name" :title="folder">
                                    <i class="bi bi-folder-fill"></i> {{ folderBaseName(folder) }}
                                </span>
                                <button type="button" class="folder-remove" @click="removeFolder(folder)"
                                    v-tooltip title="Remove folder">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            </li>
                        </ul>
                        <button type="button" class="btn-add-folder" @click="addFolder">
                            <i class="bi bi-folder-plus"></i> Add folder
                        </button>
                        <div v-if="addFolderError" class="field-hint text-danger">
                            <i class="bi bi-exclamation-circle-fill"></i> {{ addFolderError }}
                        </div>
                        <div v-if="songsStore.hasIssueFindingFolder" class="field-hint text-danger">
                            <i class="bi bi-exclamation-circle-fill"></i> Couldn't read: <span class="fw-bold">{{
                                failedFolderNames }}</span>
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

                <div class="settings-section">
                    <span class="settings-label">Guest Requests</span>

                    <div class="guest-card">
                        <p class="guest-hint">Guests on the same Wi-Fi can scan this to request songs</p>
                        <div v-if="guestLoading" class="guest-status">Starting up&hellip;</div>
                        <div v-else-if="guestQrCode" class="guest-qr">
                            <img :src="guestQrCode" alt="Guest request QR code" @click="showQrOverlay = true"
                                class="cursor-pointer" />
                            <button type="button" class="btn-enlarge" @click="showQrOverlay = true">
                                <i class="bi bi-arrows-fullscreen"></i> Show large
                            </button>
                            <span class="guest-url">{{ guestUrl }}</span>
                            <p class="guest-note">
                                Can't connect? In Windows, set this Wi-Fi network to
                                <strong>Private</strong> (Settings &rsaquo; Network &amp; Internet &rsaquo; Wi-Fi)
                                &mdash; on Public networks, Windows blocks other devices from reaching this app. If
                                this is a mobile hotspot, it may also have <strong>client isolation</strong> enabled,
                                which blocks phone-to-laptop connections entirely and can't be fixed from here.
                            </p>
                        </div>
                        <div v-else class="guest-status">
                            Connect to Wi-Fi to enable guest requests
                            <span v-if="guestError" class="d-block text-danger mt-1">{{ guestError }}</span>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <span class="settings-label">Advanced</span>
                    <button type="button" class="btn-secondary" @click="openLogFolder">
                        <i class="bi bi-file-earmark-text"></i> Open error log
                    </button>
                </div>

            </form>
        </div>
        <div class="settings-footer">
            &copy; Proffictech {{ thisYear }} &middot; v{{ appVersion }}
        </div>

    </div>

    <Teleport to="body">
        <Transition name="qr-fade">
            <div v-if="showQrOverlay" class="qr-overlay" @click.self="showQrOverlay = false">
                <div class="qr-dialog">
                    <button type="button" class="qr-close" @click="showQrOverlay = false" aria-label="Close">
                        <i class="bi bi-x-lg"></i>
                    </button>
                    <span class="eyebrow"><i class="bi bi-qr-code"></i> Scan to request a song</span>
                    <img :src="guestQrCode" alt="Guest request QR code" class="qr-large" />
                    <span class="guest-url">{{ guestUrl }}</span>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { userSongsStore } from '@/stores/songsStore';
import { computed, reactive, ref, watch } from 'vue';
import log from '@/log';

import { ColorPicker } from "vue3-colorpicker";
import "vue3-colorpicker/style.css";

const form = reactive({
    theme_color: '',
    app_title: '',
})

const thisYear = new Date().getFullYear()
const appVersion = __APP_VERSION__

const showAlert = ref(false);

const songsStore = userSongsStore()

const failedFolderNames = computed(() =>
    songsStore.failedFolders.map((f) => folderBaseName(f)).join(', ')
)

function folderBaseName(folder: string): string {
    return folder.split(/[\\/]/).pop() || folder
}

const addFolderError = ref('')

async function addFolder() {
    addFolderError.value = ''
    try {
        //@ts-ignore
        if (!window.electronAPI?.pickFolder) {
            addFolderError.value = 'electronAPI.pickFolder is unavailable (preload bridge not loaded)'
            return
        }
        //@ts-ignore
        const folder = await window.electronAPI.pickFolder()
        if (folder && !songsStore.settings.folders.includes(folder)) {
            songsStore.settings.folders.push(folder)
        }
    } catch (error: any) {
        addFolderError.value = error?.message || String(error)
        log.error('Failed to open folder picker:', error)
    }
}

function removeFolder(folder: string) {
    songsStore.settings.folders = songsStore.settings.folders.filter((f) => f !== folder)
}

async function openLogFolder() {
    try {
        //@ts-ignore
        await window.electronAPI.openLogFolder()
    } catch (error) {
        log.error('Failed to open log folder:', error)
    }
}

const settingsComponentOpen = ref<any>(null)

const guestUrl = ref('')
const guestQrCode = ref('')
const guestLoading = ref(false)
const showQrOverlay = ref(false)

const guestError = ref('')

async function loadGuestAccess() {
    if (guestUrl.value || guestLoading.value) return
    guestLoading.value = true
    guestError.value = ''
    try {
        //@ts-ignore
        if (!window.electronAPI?.getGuestUrl) {
            guestError.value = 'electronAPI.getGuestUrl is unavailable (preload bridge not loaded)'
            return
        }
        //@ts-ignore
        const url = await window.electronAPI.getGuestUrl()
        if (url) {
            guestUrl.value = url
            //@ts-ignore
            guestQrCode.value = await window.electronAPI.getGuestQrCode(url)
        } else {
            guestError.value = 'No network address found (not connected to Wi-Fi/LAN?)'
        }
    } catch (error: any) {
        guestError.value = error?.message || String(error)
        log.error('Failed to load guest access:', error)
    } finally {
        guestLoading.value = false
    }
}

watch(() => songsStore.settings.togglePanel, () => {
    form.app_title = songsStore.settings.appTitle
    form.theme_color = songsStore.settings.themeColor
    showAlert.value = false;
    settingsComponentOpen.value.click()
    loadGuestAccess()
})

watch(() => form, () => {
    songsStore.settings.appTitle = form.app_title
    songsStore.settings.themeColor = form.theme_color
}, { deep: true })


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

.folder-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.folder-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.7rem;
    border-radius: var(--radius-sm);
    background: #000000;
    border: 1px solid var(--surface-border);
}

.folder-item-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.folder-remove {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid var(--surface-border);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.folder-remove:hover {
    background: var(--surface-strong);
    color: var(--text-primary);
}

.btn-add-folder,
.btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0.55rem 0.9rem;
}

.btn-add-folder:hover,
.btn-secondary:hover {
    background: var(--surface-strong);
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

.guest-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: var(--radius-md);
    background: var(--surface);
    border: 1px solid var(--surface-border);
    text-align: center;
}

.guest-hint {
    font-size: 0.75rem;
    color: var(--text-muted);
}

.guest-status {
    font-size: 0.8rem;
    color: var(--text-faint);
    padding: 1rem 0;
}

.guest-qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.guest-qr img {
    width: 220px;
    height: 220px;
    border-radius: var(--radius-sm);
    background: #ffffff;
    padding: 0.5rem;
}

.guest-url {
    font-size: 0.72rem;
    color: var(--text-faint);
    word-break: break-all;
}

.btn-enlarge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 1px solid var(--theme-color);
    border-radius: 999px;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.4rem 0.9rem;
}

.btn-enlarge:hover {
    background: var(--surface-strong);
}

.qr-overlay {
    position: fixed;
    inset: 0;
    z-index: 1090;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
}

.qr-dialog {
    position: relative;
    width: 100%;
    max-width: 460px;
    background: #120a17;
    border: 2px solid var(--theme-color);
    border-radius: var(--radius-lg);
    box-shadow: 0 24px 70px -24px rgba(0, 0, 0, 0.8), 0 0 40px var(--theme-glow);
    padding: 2.5rem 2rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.qr-dialog .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
}

.qr-large {
    width: min(70vw, 380px);
    height: min(70vw, 380px);
    background: #ffffff;
    border-radius: var(--radius-md);
    padding: 1rem;
}

.qr-close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--surface-border);
    background: var(--surface);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
}

.qr-close:hover {
    background: var(--surface-strong);
}

.qr-fade-enter-active,
.qr-fade-leave-active {
    transition: opacity 0.15s ease;
}

.qr-fade-enter-from,
.qr-fade-leave-to {
    opacity: 0;
}

.guest-note {
    font-size: 0.7rem;
    color: var(--text-faint);
    line-height: 1.5;
    margin-top: 0.25rem;
}

.guest-note strong {
    color: var(--text-muted);
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
