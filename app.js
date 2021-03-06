const {shell, app, ipcRenderer} = require('electron')
const config = require('electron-json-config')

if (!config.has('sites')) {
    const defaults = require('./sites_default.json')
    config.set('sites', defaults)
}

let sites = config.get('sites')

let siteElems = []
let activeSite = 0

let container = undefined
let sidebar = undefined
let isMacOS = (process.platform == 'darwin')

// List of services that support checking messages via javascript
// Must contain an event listener that checks the messages in unreadApi.js
const supportedCountServices = [
    'slack',
    'hangouts',
    'gmail',
    'inbox',
    'discord'
]

$(document).ready(() => {

    // Show titlebar buttons on platform specific side
    if (isMacOS) {
        $('.left-window-buttons').show()
    } else $('.right-window-buttons').show()

    // Send ipc message on titlebar button clicks
    // to main process to handle window management
    $('.close').click(() => {
        ipcRenderer.send('close')
    })
    $('.max').click(() => {
        ipcRenderer.send('maximize')
    })
    $('.min').click(() => {
        ipcRenderer.send('minimize')
    })

    // Ctrl+r and F5 to reload the app webview
    // Ctrl+Shift+R to reload the whole app
    // Ctrl+D to open dev tools
    function keydown(e) {
        if (e.keyCode == 116) { // F5, Reload Current Webview
            if (e.preventDefault) e.preventDefault()
            sites[activeSite].webview[0].reload()
        }

        // Tab switching
        if ((e.ctrlKey && e.keyCode == '9')) {
            let nextSite = activeSite + (e.shiftKey ? -1 : 1);

            if (nextSite > sites.length-1) {
                nextSite = 0
            } else if (nextSite < 0) {
                nextSite = sites.length - 1
            }

            selectSite(nextSite)
        }

        if ((e.ctrlKey && !isMacOS) || (e.metaKey && isMacOS)) {
            switch (String.fromCharCode(e.keyCode)) {
            case 'R':
                if (e.preventDefault) e.preventDefault()
                e.shiftKey ? ipcRenderer.send('reload') : sites[activeSite].webview[0].reload()
                break
            case 'Y':
                if (e.preventDefault) e.preventDefault()
                siteElems[activeSite].webview[0].redo()
                break
            case 'Z':
                if (e.preventDefault) e.preventDefault()
                siteElems[activeSite].webview[0].undo()
                break
            }
            if (e.keyCode >= 49 && e.keyCode <= 57) {
                if (e.preventDefault) e.preventDefault()
                selectSite(e.keyCode - 49)
            }
        }
    }
    $(document).keydown(keydown)

    container = $('.container')
    sidebar = $('.sidebar')

    sites.forEach((site, index) => {
        let savedSlackIcon = localStorage.getItem(site.site)
        if (savedSlackIcon) {
            site.icon = savedSlackIcon
        }

        //Add the sidebar selector
        site.selector = $(`
            <div class="sites" title="${site.site}">
                <div class="icon dark" style="background-image: url('${site.icon}')"></div>
            </div>
        `)
        site.selector.click(() => selectSite(index))
        sidebar.append(site.selector)

        // Add notifier div
        site.notifier = $(`<div class="notifier"></div>`)
        site.notifier.css('top', 10 + (65*(index)))
        site.notifier.hide()
        sidebar.append(site.notifier)

        // Create the webview frame
        site.frame = $(`
            <div class="frame-container hidden"></div>
        `)
        site.frame.css('width', container.width())
        site.frame.css('height', container.height())

        let partition = ""
        if (site.partition) {
            partition = `partition=persist:${site.partition}`
        }

        // Append the webview itself
        site.webview = $(`
            <webview src="${site.url}" preload="./preload.js" ${partition}></webview>
        `)

        // Add to the app
        site.frame.append(site.webview)
        container.append(site.frame)

        site.webview[0].addEventListener(
            'new-window', (event) => shell.openExternal(event.url)
        )

        // Listen for webview's response
        site.webview[0].addEventListener('ipc-message', (event) => {
            if (event.channel == 'setUnreadCount') {
                event.args[0] > 0 ? notify(index) : site.notifier.hide()
            }
            else if (event.channel == 'clickedNotification') {
                selectSite(index)
                ipcRenderer.send('focus')
            }
            else if (event.channel == 'keydown-info') {
                keydown(event.args[0])
            }
        })

        site.webview.on('did-finish-load', (event) => {
            site.webview[0].send("site-info", {
                name: site.site,
                service: site.service,
                icon: site.icon,
            })
        })

        if (site.service == 'slack') {
            site.webview.on('did-finish-load', (event) => {
                site.webview[0].send("slack-icon")
            })
            site.webview[0].addEventListener('ipc-message', (event) => {
                if (event.channel == 'slackTeamIcon') {
                    site.icon = event.args[0]
                    localStorage.setItem(site.site, site.icon)
                    site.selector[0].children[0].style.backgroundImage = `url("${site.icon}")`
                }
            })
        }

        // Setup a listener to page title updates, which probably means there is a notification
        // If it's a supported service, send a request to check if there are notifications, otherwise
        // add the notification bubble. Supported services are also checked every 10 seconds for
        // good measure, but this helps to get notification immediately

        // Wait for 10 seconds before adding page title updated event, because
        // the title updates multiple times when the page is loading
        const loadingWaitTime = 10 * 1000

        setTimeout(() => {
            site.webview.on('page-title-updated', (event) => {
                if (supportedCountServices.indexOf(site.service) > -1) {
                    site.webview[0].send(site.service)
                } else {
                    notify(index)
                }
            })
        }, loadingWaitTime)

        siteElems.push(site)

    })

    // Send a check message count request every 10 seconds on the
    // site's service name channel
    setInterval(() => {
        sites.forEach((site) => {
            site.webview[0].send(site.service)
        })
    }, 10*1000)

    // Select the first site, show the sidebar selector
    selectSite(0)
    $('.selector').show()

    // Call active site on focus, this helps focus textboxes
    // when switching between windows
    ipcRenderer.on('focus', () => selectSite(activeSite))

    // This event comes from the reload in the menu
    ipcRenderer.on('reload', () => siteElems[activeSite].webview[0].reload())

    // On Windows 10 (8.1? maybe), it hides 5px when the window is maximized. So,
    // listen for when the window has been maximized or unmaximized to add a 5px border
    // so that the titlebar, and notification bubbles on the left are fully visible.
    // Also, send a query to check the status once this finishes loading, because a window
    // that starts off maximized does not send an event update
    if (process.platform == 'win32') {
        ipcRenderer.on('maximized', () => {
            $('body').addClass('maximized')
        })

        ipcRenderer.on('unmaximized', () => {
            $('body').removeClass('maximized')
        })

        ipcRenderer.send('maximized-status')
    }
})


function selectSite(i) {
    // Bail if we are selecting a site that doesn't exist
    if (i >= siteElems.length) return

    let site = siteElems[i]

    if (activeSite >= 0 && activeSite != i) {
        let activeSiteElem = siteElems[activeSite]

        // Hide the element, but set a width and height
        // This prevents the frame from being different sizes when hidden
        // If it becomes a different size it reflows when unhidden, and some
        // have noticeable reflow glitches
        activeSiteElem.frame.css('width', container.width())
        activeSiteElem.frame.css('height', container.height())
        activeSiteElem.frame.addClass('hidden')

        // Check and show the notifier when leaving if supported service
        // otherwise clear it if it is checked by title updates
        if (supportedCountServices.indexOf(site.service) > -1) {
            activeSiteElem.webview[0].send(activeSiteElem.service)
        } else {
            // Clear the notifier before leaving, if it's shown for some reason
            activeSiteElem.notifier.hide()
        }

        // Darken the site icon
        activeSiteElem.selector.find('.icon').addClass('dark')
    }


    // Make the frame visible, and focus it
    site.frame.removeClass('hidden')

    // Remove width and height css added when hiding it
    site.frame.css('width', '')
    site.frame.css('height', '')

    // Focus puts you back into the app, not on the sidebar
    site.webview[0].focus()

    // Remove the darken class from the selected icon
    site.selector.find('.icon').removeClass('dark')

    // Get the frame's actual title. Needs work on autoupdated on the webviews' update
    // title = $(`.frame-container[data-site=${i}] > webview`)[0].getTitle()

    $('title').html(site.site)
    $('.titlebar > p').html(site.site)

    // Hide the notifier (clears it)
    site.notifier.hide()

    moveSelector(i)
    activeSite = i
}

function moveSelector(i) {
    /* This calculates the y position of the selection slider. Each icon for a site
     * will take up 'iconOffset' pixels, so the formula for where it should go is
     * topOffset + iconOffset*i
    */
    const topOffset = 10
    const iconOffset = 65

    const top = topOffset + iconOffset*i
    $('.selector').css('top', `${top}px`)
    sidebar.scrollTop(top - 15)
}

function notify(i) {
    // Don't show the notifier if it's the active site
    if (activeSite != i) {
        siteElems[i].notifier.show()
    }
}
