import { ref } from 'vue'
import { defineStore } from 'pinia'

export const userSongsStore = defineStore('songsStore', () => {
  const selectedSong = ref<string>('')
  const playModal = ref<boolean>(false)

  const archive: string[] = [
    'Victory Worship-Safe.mp4',
    'Christ Is Enough.mp4'
  ]

  function setSong(songName: string) {
    selectedSong.value = songName
  }

  function songName(name: string) {
    return name.replace(/\.mp4$/, '')
  }

  function playSong(song: string) {
    selectedSong.value = song
    playModal.value = !playModal.value
  }

  return { selectedSong, setSong, archive, playModal, songName, playSong }
})
