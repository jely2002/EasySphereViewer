'use strict'

const customTitlebar = require('custom-electron-titlebar');
const { ipcRenderer } = require('electron');

let titlebar;

let leftSide;
let rightSide;
let frontSide;
let backSide;
let topSide;
let bottomSide

if(process.platform === "darwin") {
    titlebar = new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#212121'),
        maximizable: false,
        shadow: false,
        titleHorizontalAlignment: "center",
        enableMnemonics: true,
        icon: "resources/icons/icon.png"
    })
} else {
    titlebar = new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#000000'),
        maximizable: false,
        shadow: true,
        titleHorizontalAlignment: "left",
        enableMnemonics: true,
        icon: "resources/icons/icon.png"
    })
}

function setPath(element) {
    let path = ipcRenderer.sendSync('open-file-dialog');
    if(path !== undefined) {
        window[element.id + 'Side'] = path;
        $("label[for='" + $(element).attr('id') + "']").html('<p>' + element.id.charAt(0).toUpperCase() + element.id.slice(1) + ' side ' + '<i class="fas fa-check ml-2" style="color: green;"></i></p>');
        if (window.leftSide !== undefined && window.rightSide !== undefined && window.frontSide !== undefined && window.backSide !== undefined && window.topSide !== undefined && window.bottomSide !== undefined) {
            $('#open-btn').attr('disabled', false);
        }
    } else {
        $("label[for='" + $(element).attr('id') + "']").html('<p>' + element.id.charAt(0).toUpperCase() + element.id.slice(1) + ' side ' + '<i class="fas fa-times ml-2" style="color: red;"></i></p>');
    }
}

function openCubemap() {
    let sides = [];
    sides.push(window.leftSide);
    sides.push(window.frontSide);
    sides.push(window.rightSide);
    sides.push(window.backSide);
    sides.push(window.topSide);
    sides.push(window.bottomSide);
    ipcRenderer.send('close-cubemap-modal', sides);
}
