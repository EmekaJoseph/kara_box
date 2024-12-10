import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
// import songsData from './songs.json';
import { useStorage } from '@vueuse/core'

export const userSongsStore = defineStore('songsStore', () => {
  const selectedSong = ref<string>('')
  const playModal = ref<boolean>(false)
  const isPlayingSong = ref<boolean>(false)


  const settings = reactive({
    togglePanel: false,
    folderName: useStorage('karaoke_box-var_folder', 'karaoke_box'),
    appTitle: useStorage('karaoke_box-var_title', 'proffictech'),
    themeColor: useStorage('karaoke_box-var_theme', '#48214A')
  })

  // const archive = computed<string[]>(() => { return songsData[songsType.value] })
  const archive = ref<string[]>([])
  const songsDir = computed<string>(() => { return `/${settings.folderName}/` })

  function songName(name: string) {
    // return name.replace(/\.mp4$/, '')
    return name.replace(/\.[^/.]+$/, '');
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
    playSong,
    isPlayingSong,
    songsDir,
    settings
  }
})
