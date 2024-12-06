import { ref } from 'vue'
import { defineStore } from 'pinia'
import songsData from './songs.json';

// import * as fs from 'fs';
// import * as path from 'path';


export const userSongsStore = defineStore('songsStore', () => {
  const selectedSong = ref<string>('')
  const playModal = ref<boolean>(false)
  const isPlayingSong = ref<boolean>(false)

  const archive: string[] = songsData.safe
  const songsDir: string = '/videos/safe/'

  function songName(name: string) {
    return name.replace(/\.mp4$/, '')
  }

  function playSong(song: string) {
    // listFolderItems('../../public/videos');
    // return
    selectedSong.value = song
    playModal.value = !playModal.value
    isPlayingSong.value = true
  }


  // function listFolderItems(folder: string) {
  //   try {
  //     const items = fs.readdirSync(folder); // Read folder contents
  //     items.forEach((item: any) => {
  //       const fullPath = path.join(folder, item);
  //       const isDirectory = fs.lstatSync(fullPath).isDirectory();

  //       console.log(`${item} ${isDirectory ? '(Folder)' : '(File)'}`);
  //     });
  //   } catch (error: any) {
  //     console.error('Error reading folder:', error.message);
  //   }
  // }

  return { selectedSong, archive, playModal, songName, playSong, isPlayingSong, songsDir }
})
