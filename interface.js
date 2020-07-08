'use strict'
const { ipcRenderer, Menu, MenuItem } = require('electron')
const customTitlebar = require('custom-electron-titlebar');

let titlebar;

if(process.platform === "darwin") {
   titlebar = new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#212121'),
        maximizable: true,
        shadow: false,
        titleHorizontalAlignment: "center",
        enableMnemonics: false,
        icon: "resources/icons/icon.png"
    })
} else {
    titlebar = new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#000000'),
        maximizable: true,
        shadow: true,
        titleHorizontalAlignment: "left",
        enableMnemonics: true,
        icon: "resources/icons/icon.png"
    })
}

ipcRenderer.on("selectedPath", (event, arg) => {
    setPanoramaPath(arg);
})

ipcRenderer.on('menu-click', (event, arg) => {
    if(arg === "nav") {
        toggleNavbar();
    } else if(arg === "fullscreen") {
        toggleFullscreen();
    } else if(arg === "close") {
        closeViewer();
    } else if(arg === "open") {
        openNewSphere();
    }
})
