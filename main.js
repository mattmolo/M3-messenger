const electron = require('electron')
// Module to control application life.
const app = electron.app
const ipc = electron.ipcMain
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Module that keeps the window position State
const WindowStateKeeper = require('electron-window-state')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {

    // Set up browser window, with the window state keeper.
    // Window state keeper will remember the position of the window
    // when last closed

    let mainWindowState = WindowStateKeeper({
        defaultWidth: 800,
        defaultWidth: 600
    })

    mainWindow = new BrowserWindow({
        frame: false,
        width: mainWindowState.width,
        height: mainWindowState.height,
        x: mainWindowState.x,
        y: mainWindowState.y,
        icon: "./icon/Icon_1024x1024.png"
    })

    mainWindowState.manage(mainWindow)

    mainWindow.loadURL(`file://${__dirname}/index.html`)

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    mainWindow.on('focus', () => {
        mainWindow.webContents.send('focus')
    })

    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('maximized')
    })

    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('unmaximized')
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

ipc.on('focus', () => {
    mainWindow.focus()
})

ipc.on('reload', () => {
    mainWindow.reload()
})

ipc.on('toggle-devtools', () => {
    mainWindow.webContents.toggleDevTools()
})

ipc.on('maximized-status', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.webContents.send('maximized')
    }
})
