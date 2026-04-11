import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronStore', {
  get: (key) => ipcRenderer.invoke('electron-store-get', key),
  set: (key, val) => ipcRenderer.invoke('electron-store-set', key, val),
  delete: (key) => ipcRenderer.invoke('electron-store-delete', key)
});

contextBridge.exposeInMainWorld('electronMedia', {
  download: (id, url) => ipcRenderer.invoke('download-media', { id, url })
});