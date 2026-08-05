const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 650,
    title: 'IECES News Manager',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Frameless-style with custom titlebar feel
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC: pick image files ──────────────────────────────────────────────────
ipcMain.handle('pick-images', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Photos',
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
    properties: ['openFile', 'multiSelections'],
  })
  if (result.canceled) return []
  return result.filePaths.map((fp) => ({
    path: fp,
    name: path.basename(fp),
    data: fs.readFileSync(fp).toString('base64'),
    mime: fp.match(/\.png$/i)
      ? 'image/png'
      : fp.match(/\.webp$/i)
      ? 'image/webp'
      : 'image/jpeg',
  }))
})

// ── IPC: open URL in browser ──────────────────────────────────────────────
ipcMain.handle('open-url', async (_, url) => {
  await shell.openExternal(url)
})

// ── Auto-updater events ───────────────────────────────────────────────────
autoUpdater.on('update-available', () => {
  mainWindow?.webContents.send('update-available')
})
autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded')
})

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall()
})
