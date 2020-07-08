const path = require("path");
const { app, BrowserWindow, ipcMain, Menu, MenuItem, dialog, shell } = require('electron');
const { autoUpdater } = require("electron-updater");

let win;
let windowMenu;
let isNavbarHidden = false;
let sphereOpened = false;

function createWindow () {
    app.allowRendererProcessReuse = true
    if(process.platform === "darwin") {
        win = new BrowserWindow({
            show: false,
            width: 800,
            height: 500,
            resizable: true,
            maximizable: true,
            titleBarStyle: "hidden",
            icon: "resources/icons/icon.png",
            webPreferences: {
                nodeIntegration: true,
            }
        })
    } else {
        autoUpdater.checkForUpdatesAndNotify();
        win = new BrowserWindow({
            show: false,
            width: 800,
            height: 530,
            resizable: true,
            maximizable: true,
            frame: false,
            icon: "resources/icons/icon.png",
            webPreferences: {
                nodeIntegration: true
            }
        })
    }
    win.removeMenu()
    windowMenu = setApplicationMenu();
    if(process.argv[2] === '--dev') {
        win.webContents.openDevTools();
    }
    win.loadFile('index.html');
    win.on('closed', () => {
        win = null;
    })

    win.once('ready-to-show', () => {
        win.show();
    })
}

app.on('ready', () => {
    createWindow();
})

//Quit the application when all windows are closed, except for darwin
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

//Create a window when there is none, but the app is still active (darwin)
app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});

ipcMain.on('open-file-dialog', (event, arg) => {
    let path = dialog.showOpenDialog(win, {
        defaultPath: app.getPath('downloads'),
        properties: [
            'openFile',
            'createDirectory'
        ]
    }).then(result => {
        event.reply("selectedPath", result.filePaths[0]);
    });
})

ipcMain.on('change-menu-checkbox', (event, args) => {
    if(args[0] === "navbar") {
        isNavbarHidden = args[1];
    }
    windowMenu.getMenuItemById('navbarBox').checked = isNavbarHidden;
    windowMenu.getMenuItemById('fullscreenBox').checked = win.isFullScreen();
    Menu.setApplicationMenu(windowMenu);
})

ipcMain.on('change-enabled',(event, arg) => {
    sphereOpened = arg;
    windowMenu.getMenuItemById('fullscreenBox').enabled = sphereOpened;
    windowMenu.getMenuItemById('navbarBox').enabled = sphereOpened;
    windowMenu.getMenuItemById('closeSphere').enabled = sphereOpened;
    Menu.setApplicationMenu(windowMenu);
})

ipcMain.on('update-recent-list', (event, args) => { //TODO Create recent list

})

function setApplicationMenu() {
    const menu = new Menu();
    menu.append(new MenuItem({
        label: 'File',
        submenu: [
            {
                label: 'Open new sphere',
                click: () => win.webContents.send('menu-click', 'open')

            },
            {
                label: 'Close sphere',
                enabled: sphereOpened,
                id: 'closeSphere',
                click: () => win.webContents.send('menu-click', 'close')

            },
            {
                type: 'separator'
            },
            {
                label: 'Open recent sphere',
                submenu: [
                    {
                        label: 'Imaginary sphere' //TODO Create recents list
                    }
                ]
            }
        ]
    }));
    menu.append(new MenuItem({
        label: 'Window',
        submenu: [
            {
                label: 'Hide navbar',
                id: 'navbarBox',
                type: 'checkbox',
                enabled: sphereOpened,
                checked: isNavbarHidden,
                click: () => win.webContents.send('menu-click', 'nav')
            },
            {
                label: 'Fullscreen',
                id: 'fullscreenBox',
                type: 'checkbox',
                enabled: sphereOpened,
                checked: win.isFullScreen(),
                click: () => win.webContents.send('menu-click', 'fullscreen')
            },
        ]
    }));
    menu.append(new MenuItem({
        label: 'About',
        submenu: [
            {
                label: 'Visit on github',
                click: () => shell.openExternal('https://github.com/jely2002/esv')
            },
            {
                type: 'separator'
            },
            {
                label: 'Version ' + app.getVersion(),
                click: () => shell.openExternal('https://github.com/jely2002/esv/releases')
            },
            {
                label: 'By Jelle Glebbeek',
                click: () => shell.openExternal('https://jelleglebbeek.com')
            }
        ]
    }));
    Menu.setApplicationMenu(menu);
    return menu;
}
