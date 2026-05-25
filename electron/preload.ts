import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore: boolean) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore);
  },
  onSetPetVisible: (cb: (visible: boolean) => void) => {
    ipcRenderer.on('set-pet-visible', (_e, visible) => cb(visible));
  },
  onTogglePetVisible: (cb: () => void) => {
    ipcRenderer.on('toggle-pet-visible', () => cb());
  },
  // active=true means user is at screen; active=false means idle/locked/sleeping
  onUserActivity: (cb: (active: boolean) => void) => {
    ipcRenderer.on('user-activity', (_e, active) => cb(active));
  },
});
