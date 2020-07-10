'use strict'

let viewer;

function initializeSphereViewer(path) {
    let fileName;
    if(process.platform === "darwin") {
        fileName = path.split('/').pop()
    } else {
        fileName = path.split('\\').pop();
    }
    console.log(fileName)
    console.log(path)
    addRecentList(fileName, path);
    viewer = new PhotoSphereViewer.Viewer({
        container: document.querySelector('#viewer'),
        panorama: path,
        caption: '<b>Sphere:</b> ' + fileName,
        loadingTxt: 'Loading sphere...',
        navbar: [
            'autorotate',
            'zoom',
            'caption',
            {
                id: 'close-button',
                content: '<i class="fas fa-times"></i>',
                title: 'Close this sphere',
                className: 'close-button',
                onClick: () => {
                    $('#viewer').css("height", "calc(100vh - 30px)");
                    closeViewer();
                }
            },
            {
                id: 'hideNavbar-button',
                content: '<i class="fas fa-chevron-down"></i>',
                title: 'Hide the navbar',
                className: 'hideNavbar-button',
                onClick: () => {
                    toggleNavbar();
                }
            },
            {
                id: 'fullscreen-button',
                content: '<i class="fas fa-expand"></i>',
                title: 'View in fullscreen',
                className: 'fullscreen-button',
                onClick: () => {
                    toggleFullscreen();
                }
            }
        ]
    })
    viewer.on('ready', (e) => {
        window.dispatchEvent(new Event('resize'));
    });
}

function setPanoramaPath(path) {
    if(path === undefined) return;
    if(typeof viewer !== 'undefined' && viewer.children.length !== 0) viewer.destroy();
    ipcRenderer.send('change-menu-checkbox', ['navbar',false])
    initializeSphereViewer(path);
    ipcRenderer.send('change-enabled', true);
    ipcRenderer.send('update-recent-list', recentList);
    $("#viewer").css("display", "initial");
}

function closeViewer() {
    $("#viewer").css("display", "none");
    ipcRenderer.send('change-enabled', false);
    viewer.destroy();
}

function toggleNavbar() {
    if(viewer.navbar.isVisible()) {
        viewer.navbar.hide();
        ipcRenderer.send('change-menu-checkbox', ['navbar',true])
    } else {
        viewer.navbar.show();
        ipcRenderer.send('change-menu-checkbox', ['navbar',false])
    }
}

function toggleFullscreen() {
    if(viewer.isFullscreenEnabled()) {
        viewer.exitFullscreen();
        setNavHeight(false);
        ipcRenderer.send('change-menu-checkbox', ['fullscreen',false])
    } else {
        viewer.enterFullscreen();
        setNavHeight(true);
        ipcRenderer.send('change-menu-checkbox', ['fullscreen',true])
    }
}
function openNewSphere() {
    ipcRenderer.send("open-file-dialog");
}

function setNavHeight(fullscreen) {
    if(fullscreen) {
        $('#viewer').css("height", "100vh");
    } else {
        $('#viewer').css("height", "calc(100vh - 30px)");
    }
}
