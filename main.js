const electron = require('electron')
// Module to control application life.
const app = electron.app
const ipc = electron.ipcMain
const Menu = electron.Menu
const shell = electron.shell

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Module that keeps the window position State
const WindowStateKeeper = require('electron-window-state')

const config = require('electron-json-config')

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

    var menu = Menu.buildFromTemplate(buildMenu())
    Menu.setApplicationMenu(menu)
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

function buildMenu() {
    template = [
        {
            label: 'Edit',
            submenu: [
                {role: 'cut'},
                {role: 'copy'},
                {role: 'paste'},
                {role: 'pasteandmatchstyle'},
                {role: 'selectall'},
                {type: 'separator'},
                {
                    label: 'Preferences',
                    click () { shell.openItem(config.file()) }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: "CommandOrControl+R",
                    click () { mainWindow.webContents.send('reload') },
                },
                {role: 'forcereload'},
                {role: 'toggledevtools'},
                {type: 'separator'},
                {role: 'togglefullscreen'}
            ]
        },
        {
            role: 'window',
            submenu: [
                {role: 'minimize'},
                {role: 'close'}
            ]
        },
        {
            role: 'help',
            submenu: [{
                label: 'Github',
                click () { require('electron').shell.openExternal('https://github.com/mattmolo/M3-messenger') }
            }]
        }
    ]

    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                {role: 'about'},
                {type: 'separator'},
                {role: 'services', submenu: []},
                {type: 'separator'},
                {role: 'hide'},
                {role: 'hideothers'},
                {role: 'unhide'},
                {type: 'separator'},
                {role: 'quit'}
            ]
        })

        // Edit menu
        template[1].submenu.push(
            {type: 'separator'},
            {
                label: 'Speech',
                submenu: [
                    {role: 'startspeaking'},
                    {role: 'stopspeaking'}
                ]
            }
        )

        // Window menu
        template[3].submenu = [
            {role: 'close'},
            {role: 'minimize'},
            {role: 'zoom'},
            {type: 'separator'},
            {role: 'front'}
        ]
    }

    return template
}
