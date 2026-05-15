
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getDatosSQL:  (anio, mes,fechaInforme) => ipcRenderer.invoke('obtener-datos-db', { anio, mes, fechaInforme}),
  abrirArchivo: ()          => ipcRenderer.invoke('abrir-archivo')
})