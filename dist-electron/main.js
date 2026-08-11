"use strict";
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1e3,
    minHeight: 650,
    title: "IECES News Manager",
    backgroundColor: "#f8fafc",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default"
  });
  if (isDev) {
    mainWindow.webContents.openDevTools();
    const loadDevServer = async () => {
      try {
        await mainWindow.loadURL("http://localhost:5173");
      } catch (err) {
        console.log("Vite dev server not ready, retrying in 1 second...");
        setTimeout(loadDevServer, 1e3);
      }
    };
    loadDevServer();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.whenReady().then(() => {
  createWindow();
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
ipcMain.handle("pick-images", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Photos",
    filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "webp"] }],
    properties: ["openFile", "multiSelections"]
  });
  if (result.canceled) return [];
  return result.filePaths.map((fp) => ({
    path: fp,
    name: path.basename(fp),
    data: fs.readFileSync(fp).toString("base64"),
    mime: fp.match(/\.png$/i) ? "image/png" : fp.match(/\.webp$/i) ? "image/webp" : "image/jpeg"
  }));
});
ipcMain.handle("open-url", async (_, url) => {
  await shell.openExternal(url);
});
autoUpdater.on("update-available", () => {
  mainWindow == null ? void 0 : mainWindow.webContents.send("update-available");
});
autoUpdater.on("update-downloaded", () => {
  mainWindow == null ? void 0 : mainWindow.webContents.send("update-downloaded");
});
ipcMain.handle("install-update", () => {
  autoUpdater.quitAndInstall();
});
