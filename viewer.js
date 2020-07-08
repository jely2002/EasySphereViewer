'use strict'

let viewer;
let navVisible = true;

function initializeSphereViewer(path) {
    let fileName;
    if(process.platform === "darwin") {
        fileName = path.split('/').pop()
    } else {
        fileName = path.split('\\').pop();
    }
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
        if(!navVisible) {
            viewer.navbar.hide();
        }
    });
}

function setPanoramaPath(path) {
    if(path === undefined) return;
    if(viewer !== undefined) viewer.destroy();
    initializeSphereViewer(path);
    ipcRenderer.send('change-enabled', true);
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
        $('#viewer').css("height", "calc(100vh - 30px)");
        ipcRenderer.send('change-menu-checkbox', ['fullscreen',false])
    } else {
        $('#viewer').css("height", "100vh");
        viewer.enterFullscreen();
        ipcRenderer.send('change-menu-checkbox', ['fullscreen',true])
    }
}
function openNewSphere() {
    if(viewer !== undefined) navVisible = viewer.navbar.isVisible();
    ipcRenderer.send("open-file-dialog");
}
