const { ipcRenderer } = require("electron");

/*
 * This file contains event callbacks, that can check the webpage
 * for unread counts. If the service is not listed here, the app
 * will listen to changes of the title for webpage updates. The
 * callback should listen on the service name, which matches the
 * service defined in the site.json. The last line must be
 * ipcRenderer.sendToHost("setUnreadCount", count)
 * to respond to the app how many messages there are.
*/

ipcRenderer.on("slack", () => {
    var count = 0
    $(".unread_msgs").each(function() {
        count += isNaN(parseInt($(this).html())) ? 0 : parseInt($(this).html())
    });
    $(".unread_highlights").each(function() {
        count += isNaN(parseInt($(this).html())) ? 0 : parseInt($(this).html())
    });

    ipcRenderer.sendToHost("setUnreadCount", count)
})

ipcRenderer.on("hangouts", () => {
    var count = document.getElementById("hangout-landing-chat")
        .lastChild.contentWindow
        .document.body.getElementsByClassName("ee")
        .length

    ipcRenderer.sendToHost("setUnreadCount", count)
})

ipcRenderer.on("gmail", () => {
    var count = 0
    var element = document.getElementsByClassName("aim")[0]

    if (element.textContent.indexOf("(") != -1) {
        count = parseInt(element.textContent.replace(/[^0-9]/g, ""))
    }

    ipcRenderer.sendToHost("setUnreadCount", count)
})

ipcRenderer.on("inbox", () => {
    var count = document.getElementsByClassName("ss").length

    ipcRenderer.sendToHost("setUnreadCount", count)
})

ipcRenderer.on("groupme", () => {
    var count = 0
    var elems = document.querySelectorAll(".badge-count")

    for (var i = 0; i < elems.length; i++) {
        var c = parseInt(elems[i].innerHTML.trim())
        count += isNaN(c) ? 0 : c;
    }

    ipcRenderer.sendToHost("setUnreadCount", count)
})

ipcRenderer.on("discord", () => {
    var guildCount = document.getElementsByClassName("guild unread").length

    var badgeCount = 0
    var badges = document.getElementsByClassName("badge")

    for (var i = 0; i < badges.length; i++) {
        var c = parseInt(badges[i].innerHTML.trim())
        badgeCount += isNaN(c) ? 0 : c;
    }

    var count = guildCount + badgeCount

    ipcRenderer.sendToHost("setUnreadCount", count);
})
