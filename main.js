const electron = require('electron')
// Module to control application life.
const app = electron.app
const ipc = electron.ipcMain
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
    mainWindow = new BrowserWindow({frame: false, width: 800, height: 600})

    mainWindow.loadURL(`file://${__dirname}/app/build/index.html`)

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    mainWindow.webContents.openDevTools()

    mainWindow.on('focus', () => {
        mainWindow.webContents.send('focus')
    })
}

// Called when electron finishes startup
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', app.quit)

ipc.on('close', () => {
    mainWindow.close()
})
ipc.on('maximize', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
    }
    else {
        mainWindow.maximize()
    }
})
ipc.on('minimize', () => {
    mainWindow.minimize()
})

