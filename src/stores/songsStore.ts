import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export interface QueueRequest {
  id: string
  song: string
  name: string
  requestedAt: number
}

export const userSongsStore = defineStore('songsStore', () => {
  const selectedSong = ref<string>('')
  const playModal = ref<boolean>(false)
  const isPlayingSong = ref<boolean>(false)
  const hasIssueFindingFolder = ref<boolean>(false)
  const failedFolders = ref<string[]>([])
  const queue = ref<QueueRequest[]>([])

  const settings = reactive({
    togglePanel: false,
    folders: useStorage<string[]>('karaoke_box-var_folders', []),
    appTitle: useStorage('karaoke_box-var_title', 'proffictech'),
    themeColor: useStorage('karaoke_box-var_theme', '#ff2e88')
  })

  // Songs are identified by their full, absolute filesystem path so that
  // multiple library folders can be merged without name collisions.
  const archive = ref<string[]>([])

  function baseName(fullPath: string): string {
    return fullPath.split(/[\\/]/).pop() || fullPath
  }

  function songName(fullPath: string): string {
    return baseName(fullPath).replace(/\.[^/.]+$/, '')
  }

  // Converts an absolute filesystem path into a proper file:// URL a
  // <video> element can load, regardless of which folder it came from.
  function toFileUrl(fullPath: string): string {
    const normalized = fullPath.replace(/\\/g, '/')
    const encoded = normalized
      .split('/')
      .map((segment) => (/^[A-Za-z]:$/.test(segment) ? segment : encodeURIComponent(segment)))
      .join('/')
    return encoded.startsWith('/') ? `file://${encoded}` : `file:///${encoded}`
  }

  function playSong(song: string) {
    selectedSong.value = song
    playModal.value = !playModal.value
    isPlayingSong.value = true
  }

  return {
    selectedSong,
    archive,
    playModal,
    songName,
    toFileUrl,
    playSong,
    isPlayingSong,
    settings,
    hasIssueFindingFolder,
    failedFolders,
    queue
  }
})
