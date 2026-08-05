const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  pickImages: () => ipcRenderer.invoke('pick-images'),
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', cb),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', cb),
})
