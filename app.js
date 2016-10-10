
//TODO: Grab this from db or local configuration
let sites = require('./sites.json')
let menu = require('electron-context-menu')
const {shell, app, ipcRenderer} = require('electron')

let siteElems = []
let activeSite = 0

let container = undefined
let sidebar = undefined


$(document).ready(() => {


    if (process.platform == 'darwin') {
        $('.left-window-buttons').show()
    }
    else {
        $('.right-window-buttons').show()
    }


    $('.close').click(() => {
        ipcRenderer.send('close')
    })
    $('.max').click(() => {
        ipcRenderer.send('maximize')
    })
    $('.min').click(() => {
        ipcRenderer.send('minimize')
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
            let mod = (process.platform == 'darwin') ? 'Cmd' : 'Ctrl'
            sidebar.append(`<p>${mod} + ${index+1}</p>`)
        }

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
            <webview src="${site.url}"></webview>
        `)

        // Add to the app
        site.frame.append(site.webview)
        container.append(site.frame)

        site.webview[0].addEventListener('new-window', (e) => {
            shell.openExternal(e.url)
        })

        site.webview[0].addEventListener('new-window', (e) => {
            shell.openExternal(e.url)
        })

        menu({
            window: site.webview[0]
        })

        siteElems.push(site)

        // Set up control shortcuts
        $(document).keydown((e) => {
            let key = 49 + index // Number 1 keycode is 49
            if (e.ctrlKey && e.keyCode == key ||
                e.metaKey && e.keyCode == key) {
                selectSite(index)
            }
        })
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

    // Select the first site, show the sidebar selector
    selectSite(0);
    $('.selector').show()

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

        // Clear the notifier before leaving, if it's shown for some reason
        activeSiteElem.notifier.hide()

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
    const top = 15 + (80*i);
    $('.selector').css('top', `${top}px`)
    sidebar.scrollTop(top - 15);
}

function notify(i) {
    // Don't show the notifier if it's the active site
    if (activeSite != i) {
        siteElems[i].notifier.show()
    }
}

