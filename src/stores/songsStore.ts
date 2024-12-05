import { ref } from 'vue'
import { defineStore } from 'pinia'

export const userSongsStore = defineStore('songsStore', () => {
  const selectedSong = ref<string>('')
  const playModal = ref<boolean>(false)

  const songsArchive = ref<string[]>([
    'song1.mp4', 'song2.mp4'
  ])

  function setSong(songName: string) {
    selectedSong.value = songName
  }

  return { selectedSong, setSong, songsArchive, playModal }
})
