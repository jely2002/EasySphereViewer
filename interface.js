'use strict'
const { ipcRenderer, Menu, MenuItem } = require('electron');
const fs = require('fs');
const mkdirp = require('mkdirp');
const customTitlebar = require('custom-electron-titlebar');

let titlebar;
let recentList;

getRecentList();
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
    } else {
        setPanoramaPath(arg);
    }
})

ipcRenderer.on('change-navbar', (event, arg) => {
    setNavHeight(arg);
})

function getDataPath() {
    let dataPath;
    if(process.platform === "win32") {
        dataPath = 'resources/data/';
    } else {
        dataPath = ipcRenderer.sendSync('get-apppath').slice(0, -8) + 'data/';
    }
    return dataPath;
}

function dataAvailable(file, dataPath) {
    try {
        if (fs.existsSync(dataPath + file)) {
            return true;
        }
    } catch(err) {
        return false;
    }
}

function getRecentList() {
    let dataPath = getDataPath();
    if(dataAvailable('recents.json', dataPath)) {
        recentList = JSON.parse(fs.readFileSync(dataPath + 'recents.json'));
        recentList.sort((a, b) => b.date - a.date);
    } else {
        recentList = [];
    }
    updateRecentMenu();
    return recentList;
}

function checkRecentDuplicate(data, newData, dataPath) {
    let found = false;
    data.forEach((item) => {
        if(item.path === newData.path) {
            item.date = Date.now();
            found = true;
        }
    })
    if(found) {
        data.sort((a, b) => b.date - a.date);
        recentList = data;
        writeFile(dataPath, 'recents.json', JSON.stringify(data));
    }
    return found;
}

ipcRenderer.on('get-recents', (event) => {
    event.reply = getRecentList();
})

function updateRecentMenu() {
    ipcRenderer.send('update-recent-list', recentList);
}

function addRecentList(name, path) {
   let dataPath = getDataPath();
   let newData = {
       name: name,
       path: path,
       date: Date.now()
   }
   if(dataAvailable('recents.json', dataPath)) {
       let recentJSONData = JSON.parse(fs.readFileSync(dataPath + 'recents.json'));
       let recentData = [];
       for(let key in recentJSONData) {
           recentData.push(recentJSONData[key]);
       }
       recentData.sort((a, b) => b.date - a.date);
       if(!checkRecentDuplicate(recentData, newData, dataPath)) {
           recentData.sort((a, b) => b.date - a.date);
           if (recentData.length === 5) {
               recentData.splice(-1, 1);
               recentData.push(newData);
           } else {
               recentData.push(newData);
           }
           recentData.sort((a, b) => b.date - a.date);
           writeFile(dataPath, 'recents.json',JSON.stringify(recentData));
           recentList = recentData;
       }
   } else {
       writeFile(dataPath, 'recents.json',JSON.stringify([newData]));
       recentList = [newData];
   }
   updateRecentMenu();

}

function writeFile(path, file, contents) {
    mkdirp(path).then(() => {
        fs.writeFileSync(path + file, contents);
    })
}

document.ondragover = document.ondrop = (ev) => {
    ev.preventDefault()
}

document.body.ondrop = (ev) => {
    setPanoramaPath(ev.dataTransfer.files[0].path);
    ev.preventDefault();
}
