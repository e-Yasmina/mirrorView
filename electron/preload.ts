import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getRunningProcesses: () => ipcRenderer.invoke('get-running-processes'),
  platform: process.platform
});
