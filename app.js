
//TODO: Grab this from db or local configuration
let sites = require('./sites.json')
let menu = require('electron-context-menu')
const {shell, app, ipcRenderer} = require('electron')

let siteElems = []
let activeSite = 0

let container = undefined
let sidebar = undefined

// List of services that support checking messages via javascript
// Must contain an event listener that checks the messagse in unreadApi.js
const supportedCountServices = [
    'slack',
    'hangouts',
    'groupme',
    'gmail',
    'inbox',
    'discord'
]

$(document).ready(() => {

    // Show titlebar buttons on platform specific side
    if (process.platform == 'darwin') {
        $('.left-window-buttons').show()
    }
    else {
        $('.right-window-buttons').show()
    }

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
    $(document).keydown((e) => {
        switch (e.keyCode) {
        case 82: // R
            if (e.ctrlKey || e.metaKey) {
                if (e.shiftKey) {
                    ipcRenderer.send('reload')
                } else {
                    sites[activeSite].webview[0].reload()
                }
            }
        case 116: // F5
            sites[activeSite].webview[0].reload()
        case 68: // D
            if (e.ctrlKey || e.metaKey) {
                ipcRenderer.send('toggle-devtools')
            }
        }
    })

    container = $('.container')
    sidebar = $('.sidebar')

    sites.forEach((site, index) => {

        //Add the sidebar selector
        site.selector = $(`
            <div class="sites" title="${site.site}">
                <img class="dark" src="${site.icon}">
            </div>
        `)
        site.selector.click(() => {
            selectSite(index);
        })
        sidebar.append(site.selector)

        // Add Ctrl + # Text
        // Can't have a Ctrl + 10
        if (index + 1 < 10) {
            const mod = (process.platform == 'darwin') ? 'Cmd' : 'Ctrl'
            sidebar.append(`<p>${mod} + ${index+1}</p>`)
        }

        // Set up control shortcuts
        $(document).keydown((e) => {
            const key = 49 + index // Number 1 keycode is 49
            if ((e.ctrlKey || e.metaKey) && e.keyCode == key) {
                selectSite(index)
            }
        })

        // Add notifier div
        site.notifier = $(`<div class="notifier"></div>`)
        site.notifier.css('top', 15 + (80*(index)))
        site.notifier.hide()
        sidebar.append(site.notifier)

        // Create the webview frame
        site.frame = $(`
            <div class="frame-container hidden"></div>
        `)
        site.frame.css('width', container.width())
        site.frame.css('height', container.height())

        // Append the webview itself
        site.webview = $(`
            <webview src="${site.url}" preload="./unreadApi.js" ></webview>
        `)

        // Add to the app
        site.frame.append(site.webview)
        container.append(site.frame)

        site.webview[0].addEventListener('new-window', (e) => {
            shell.openExternal(e.url)
        })

        // If this is a supported service, call a setInterval that sends
        // a message to the webview. In unreadApi.js, the listeners are setup
        // on their service name channel. When called, it will respond with the
        // message count, which we then use to update the notifier bubble
        // If it is not supported, setup a listener that checks for page title updates
        if (supportedCountServices.indexOf(site.service) > -1) {
            // Listen for webview's response
            site.webview[0].addEventListener('ipc-message', (event) => {
                if (event.channel == 'setUnreadCount') {
                    event.args[0] > 0 ? notify(index) : site.notifier.hide()
                }
            })

            // Send a check message count request every 5 seconds on the
            // site's service name channel
            setInterval(() => {
                site.webview[0].send(site.service)
            }, 5000)
        } else {
            // Wait for 10 seconds before adding page title updated event, because
            // the title updates multiple times when the page is loading
            const loadingWaitTime = 10 * 1000

            setTimeout(() => {
                site.webview.on('page-title-updated', (e) => {
                    notify(index)
                })
            }, loadingWaitTime)
        }

        // Context menu
        menu({
            window: site.webview[0]
        })

        siteElems.push(site)

    })

    // Select the first site, show the sidebar selector
    selectSite(0);
    $('.selector').show()

    // Call active site on focus, this helps focus textboxes
    // when switching between windows
    ipcRenderer.on('focus', () => {
        selectSite(activeSite)
    })
})


function selectSite(i) {

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
        activeSiteElem.selector.find('img').addClass('dark')
    }


    // Make the frame visible, and focus it
    site.frame.removeClass('hidden')

    // Remove width and height css added when hiding it
    site.frame.css('width', '');
    site.frame.css('height', '');

    // Focus puts you back into the app, not on the sidebar
    site.webview.focus()

    // Remove the darken class from the selected icon
    site.selector.find('img').removeClass('dark')

    // Get the frame's actual title. Needs work on autoupdated on the webviews' update
    // title = $(`.frame-container[data-site=${i}] > webview`)[0].getTitle()

    $('title').html(site.site)
    $('.titlebar > p').html(site.site)

    // Hide the notifier (clears it)
    site.notifier.hide()

    moveSelector(i)
    activeSite = i;
}

function moveSelector(i) {
    /* This calculates the y position of the selection slider. A site with the
    * hotkey text is defined with withText and without the hotkey text is
    * defined with withoutText. After 9 items in the list, there cannot be
    * a Ctrl+10 hotkey, so we stop putting the text. This takes into account
    * the offset after 9 sites (which is why it's weird..)
    */
    const topOffset = 15;

    const withTextMultiple = 80;
    const withoutTextMultiple = 55;

    const withTextCount = (i <= 9 ? i : 9);
    const withoutTextCount = (i > 9 ? i-9 : 0);

    const top = topOffset + (withTextMultiple*withTextCount + withoutTextCount*withoutTextMultiple)
    $('.selector').css('top', `${top}px`)
    sidebar.scrollTop(top - 15);
}

function notify(i) {
    // Don't show the notifier if it's the active site
    if (activeSite != i) {
        siteElems[i].notifier.show()
    }
}

