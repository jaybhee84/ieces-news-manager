const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow
let manualUpdateCheck = false

function createApplicationMenu() {
  const template = [
    {
      label: 'File',
      submenu: [{ role: 'quit' }],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: async () => {
            if (isDev) {
              await dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Check for Updates',
                message: 'Update checks are available in the installed app.',
              })
              return
            }

            manualUpdateCheck = true
            try {
              await autoUpdater.checkForUpdates()
            } catch (error) {
              manualUpdateCheck = false
              await dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Update Check Failed',
                message: 'The app could not check for updates.',
                detail: error.message,
              })
            }
          },
        },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 650,
    title: 'IECES Media Manager',
    // Window & Taskbar icon configuration
    icon: path.join(__dirname, '../public/iecesmediamanager.png'),
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  })

  if (isDev) {
    mainWindow.webContents.openDevTools()

    const loadDevServer = async () => {
      try {
        await mainWindow.loadURL('http://localhost:5173')
      } catch (err) {
        console.log('Vite dev server not ready, retrying in 1 second...')
        setTimeout(loadDevServer, 1000)
      }
    }

    loadDevServer()
  } else {
    // Loads built Vite production output relative to src/main.js
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()
  createApplicationMenu()

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

// IPC: pick image files
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

// IPC: open URL in browser
ipcMain.handle('open-url', async (_, url) => {
  await shell.openExternal(url)
})

// Auto-updater events
autoUpdater.on('update-available', () => {
  mainWindow?.webContents.send('update-available')

  if (manualUpdateCheck) {
    manualUpdateCheck = false
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: 'A new version is available.',
      detail: 'It is downloading in the background. The app will let you know when it is ready to install.',
    })
  }
})
autoUpdater.on('update-not-available', () => {
  if (!manualUpdateCheck) return

  manualUpdateCheck = false
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'No Updates Available',
    message: `IECES Media Manager ${app.getVersion()} is up to date.`,
  })
})
autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded')
})

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall()
})
