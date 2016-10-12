let menu = require('electron-context-menu')
const {shell, app, ipcRenderer} = require('electron')

    /*
    site.webview[0].addEventListener('new-window', (e) => {
        shell.openExternal(e.url)
    })

    site.webview[0].addEventListener('new-window', (e) => {
        shell.openExternal(e.url)
    })

    menu({
        window: site.webview[0]
    })

    // Set up control shortcuts
    $(document).keydown((e) => {
        let key = 49 + index // Number 1 keycode is 49
        if (e.ctrlKey && e.keyCode == key ||
            e.metaKey && e.keyCode == key) {
            selectSite(index)
        }
    })

    // Wait for 5 seconds before adding page title updated event, because
    // the title updates multiple times when the page is loading
    const loadingWaitTime = 5 * 1000

    setTimeout(() => {
        siteElems.forEach((site, i) => {
            site.webview.on('page-title-updated', (e) => {
                notify(i)
            })
        })
    }, loadingWaitTime)

    ipcRenderer.on('focus', () => {
        selectSite(activeSite)
        })
        */
