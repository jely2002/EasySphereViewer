const path = require("path");
const { app, BrowserWindow, ipcMain, Menu, MenuItem, dialog, shell } = require('electron');
const { autoUpdater } = require("electron-updater");

let win;
let cubeModal;
let windowMenu;
let lastVisitedPath = app.getPath('downloads');
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
            //icon: "resources/icons/icon.png",
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
           // icon: "resources/icons/icon.png",
            webPreferences: {
                nodeIntegration: true
            }
        })
    }
    win.removeMenu()
    windowMenu = setApplicationMenu();
    console.log(windowMenu.getMenuItemById('recents').submenu.items);
    if(process.argv[2] === '--dev') {
        win.webContents.openDevTools();
    }
    win.loadFile('index.html');
    win.on('closed', () => {
        win = null;
    })
    win.on('leave-html-full-screen', (event, arg) => {
        windowMenu.getMenuItemById('fullscreenBox').checked = win.isFullScreen();
        win.webContents.send('change-navbar', false)
        Menu.setApplicationMenu(windowMenu);
    })
    win.on('enter-html-full-screen', (event, arg) => {
        windowMenu.getMenuItemById('fullscreenBox').checked = win.isFullScreen();
        win.webContents.send('change-navbar', true)
        Menu.setApplicationMenu(windowMenu);
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
    dialog.showOpenDialog(win, {
        defaultPath: lastVisitedPath,
        properties: [
            'openFile',
            'createDirectory'
        ]
    }).then(result => {
        if(result.filePaths.length !== 0) {
            if (process.platform === "darwin") {
                lastVisitedPath = result.filePaths[0].split('/').splice(-1, 1).join();
            } else {
                lastVisitedPath = result.filePaths[0].split('\\').splice(-1, 1).join();
            }
        }
        event.returnValue = result.filePaths[0];
    });
})

ipcMain.on('get-apppath', event => {
    event.returnValue = app.getAppPath();
})

ipcMain.on('get-homepath', event => {
    event.returnValue = app.getPath("home");
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

ipcMain.on('open-cubemap-modal', (event) => {
    cubeModal = new BrowserWindow({parent: win,
        modal: true,
        show: false,
        resizable: false,
        maximizable: false,
        titleBarStyle: "hidden",
        width: 400,
        height: 500,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    cubeModal.removeMenu();
    cubeModal.loadFile('cubemapModal.html');
    cubeModal.once('ready-to-show', () => {
        cubeModal.show();
    })
})

ipcMain.on('close-cubemap-modal', (event, arg) => {
    if(arg !== undefined) {
        win.webContents.send('cubemap-selected', arg);
    }
    cubeModal.close();
})

ipcMain.on('update-recent-list', (event, arg) => {
    let recentList = arg;
    windowMenu.getMenuItemById('recents').submenu.items = [];
    if(recentList.length === 0) {
        windowMenu.getMenuItemById('recents').enabled = false;
    } else {
        windowMenu.getMenuItemById('recents').enabled = true;
        recentList.forEach((item) => {
            let recentItem = {
                label: truncateString(item.name, 30),
                enabled: true,
                click: () => win.webContents.send('menu-click', item.path)
            }
            windowMenu.getMenuItemById('recents').submenu.items.push(recentItem);
        })
    }
})

ipcMain.on('update-recent-cubemap-list', (event, arg) => {
    let recentCubemapList = arg;
    windowMenu.getMenuItemById('cubemapRecents').submenu.items = [];
    if(recentCubemapList.length === 0) {
        windowMenu.getMenuItemById('cubemapRecents').enabled = false;
    } else {
        windowMenu.getMenuItemById('cubemapRecents').enabled = true;
        recentCubemapList.forEach((item) => {
            let recentItem = {
                label: truncateString(item.name, 30),
                enabled: true,
                click: () => win.webContents.send('menu-click', item.sides)
            }
            windowMenu.getMenuItemById('cubemapRecents').submenu.items.push(recentItem);
        })
    }
})

function truncateString(string, length){
    if (string.length > length)
        return string.substring(0,length)+'...';
    else
        return string;
}

function setApplicationMenu() {
    const menu = new Menu();
    menu.append(new MenuItem({
        label: 'File',
        submenu: [
            {
                label: 'Open new sphere',
                click: () => win.webContents.send('menu-click', 'open'),
                accelerator: "CommandOrControl+O"

            },
            {
                label: 'Open new cubemap',
                click: () => win.webContents.send('menu-click', 'openCubemap'),
                accelerator: "CommandOrControl+Shift+O"

            },
            {
                label: 'Close file',
                enabled: sphereOpened,
                id: 'closeSphere',
                click: () => win.webContents.send('menu-click', 'close'),
                accelerator: "CommandOrControl+Q"

            },
            {
                type: 'separator'
            },
            {
                label: 'Open recent sphere',
                id: 'recents',
                submenu: []
            },
            {
                label: 'Open recent cubemap',
                id: 'cubemapRecents',
                submenu: []
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
                click: () => win.webContents.send('menu-click', 'nav'),
                accelerator: "CommandOrControl+H"
            },
            {
                label: 'Fullscreen',
                id: 'fullscreenBox',
                type: 'checkbox',
                enabled: sphereOpened,
                checked: win.isFullScreen(),
                click: () => win.webContents.send('menu-click', 'fullscreen'),
                accelerator: "F11"
            },
        ]
    }));
    menu.append(new MenuItem({
        label: 'About',
        submenu: [
            {
                label: 'Visit on github',
                click: () => shell.openExternal('https://github.com/jely2002/easysphereviewer')
            },
            {
                type: 'separator'
            },
            {
                label: 'Version ' + app.getVersion(),
                click: () => shell.openExternal('https://github.com/jely2002/easysphereviewer/releases')
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
