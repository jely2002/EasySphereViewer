'use strict'
const { ipcRenderer } = require('electron');
const fs = require('fs');
const mkdirp = require('mkdirp');
const customTitlebar = require('custom-electron-titlebar');

let titlebar;
let recentList;
let recentCubemapList;

getRecentList();
getCubemapRecentList();
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
    setSpherePath(arg);
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
    }  else if(arg === "openCubemap") {
        ipcRenderer.send('open-cubemap-modal');
    } else if(Array.isArray(arg)) {
        setCubemapPath(arg);
    } else {
        setSpherePath(arg);
    }
})

ipcRenderer.on('cubemap-selected', (event, arg) => {
    setCubemapPath(arg);
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

function getCubemapRecentList() {
    let dataPath = getDataPath();
    if(dataAvailable('cubemapRecents.json', dataPath)) {
        recentCubemapList = JSON.parse(fs.readFileSync(dataPath + 'cubemapRecents.json'));
        recentCubemapList.sort((a, b) => b.date - a.date);
    } else {
        recentCubemapList = [];
    }
    updateRecentCubemapMenu();
    return recentCubemapList;
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

function checkRecentCubemapDuplicate(data, newData, dataPath) {
    let found = false;
    data.forEach((item) => {
        console.log(item.sides)
        console.log(newData.sides)
        if(JSON.stringify(item.sides)==JSON.stringify(newData.sides)) {
            item.date = Date.now();
            found = true;
        }
    })
    if(found) {
        data.sort((a, b) => b.date - a.date);
        recentCubemapList = data;
        writeFile(dataPath, 'cubemapRecents.json', JSON.stringify(data));
    }
    return found;
}

ipcRenderer.on('get-recents', (event) => {
    event.reply = getRecentList();
})

ipcRenderer.on('get-cubemap-recents', (event) => {
    event.reply = getCubemapRecentList();
})

function updateRecentMenu() {
    ipcRenderer.send('update-recent-list', recentList);
}

function updateRecentCubemapMenu() {
    ipcRenderer.send('update-recent-cubemap-list', recentCubemapList);
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

function addRecentCubemapList(name, sides) {
    let dataPath = getDataPath();
    let newData = {
        name: name,
        sides: sides,
        date: Date.now()
    }
    if(dataAvailable('cubemapRecents.json', dataPath)) {
        let recentJSONData = JSON.parse(fs.readFileSync(dataPath + 'cubemapRecents.json'));
        let recentData = [];
        for(let key in recentJSONData) {
            recentData.push(recentJSONData[key]);
        }
        recentData.sort((a, b) => b.date - a.date);
        if(!checkRecentCubemapDuplicate(recentData, newData, dataPath)) {
            recentData.sort((a, b) => b.date - a.date);
            if (recentData.length === 5) {
                recentData.splice(-1, 1);
                recentData.push(newData);
            } else {
                recentData.push(newData);
            }
            recentData.sort((a, b) => b.date - a.date);
            writeFile(dataPath, 'cubemapRecents.json',JSON.stringify(recentData));
            recentCubemapList = recentData;
        }
    } else {
        writeFile(dataPath, 'cubemapRecents.json',JSON.stringify([newData]));
        recentCubemapList = [newData];
    }
    updateRecentCubemapMenu();

}

function writeFile(path, file, contents) {
    mkdirp(path).then(() => {
        fs.writeFileSync(path + file, contents);
    })
}

function arraysEqual(a1,a2) {
    return JSON.stringify(a1)==JSON.stringify(a2);
}

document.ondragover = document.ondrop = (ev) => {
    ev.preventDefault()
}

document.body.ondrop = (ev) => {
    setSpherePath(ev.dataTransfer.files[0].path);
    ev.preventDefault();
}
