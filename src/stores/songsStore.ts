import { ref } from 'vue'
import { defineStore } from 'pinia'
import songsData from './songs.json';

export const userSongsStore = defineStore('songsStore', () => {
  const selectedSong = ref<string>('')
  const playModal = ref<boolean>(false)
  const isPlayingSong = ref<boolean>(false)

  const archive: string[] = songsData.songs

  function songName(name: string) {
    return name.replace(/\.mp4$/, '')
  }

  function playSong(song: string) {
    selectedSong.value = song
    playModal.value = !playModal.value
    isPlayingSong.value = true
  }

  return { selectedSong, archive, playModal, songName, playSong, isPlayingSong }
})
