const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const db = require('./db.js'); // Asegúrate de que el archivo db.js esté en la misma carpeta

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Pick Up Manager - Gestión Hotelera",
    webPreferences: {
      nodeIntegration: false,    // Por seguridad
      contextIsolation: true,    // Por seguridad
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
  win.webContents.openDevTools()
}

// ── MANEJADORES IPC (Comunicación con el Renderer) ──

/**
 * Manejador para obtener datos de SQL Server
 */
ipcMain.handle('obtener-datos-db', async (event, args) => {
  try {
    // args contiene { anio, mes } enviado desde renderer.js
    const resultado = await db.getDatosMes(args.anio, args.mes, args.fechaInforme);
    return resultado;
  } catch (error) {
    console.error("Error en el proceso principal al consultar DB:", error);
    return { ok: false, error: error.message };
  }
});

/**
 * Manejador para abrir el explorador de archivos
 */
ipcMain.handle('abrir-archivo', async () => {
  const resultado = await dialog.showOpenDialog(win, {
    title: 'Seleccionar archivo de datos',
    filters: [
      { name: 'Documentos de Excel', extensions: ['xlsx', 'csv'] },
      { name: 'Todos los archivos', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (!resultado.canceled) {
    return resultado.filePaths[0];
  }
  return null;
});

// ── EVENTOS DE LA APLICACIÓN ──

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});