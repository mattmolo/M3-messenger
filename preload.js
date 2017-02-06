/*
 * This file contains code that is loaded via the webview preload
 * to each webview. Currently used to event listeners for counting
 * unread messages, and setting up the spell checking with a menu
*/

const { ipcRenderer } = require("electron");

/*
 * This code contains event callbacks, that can check the webpage
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


/*
 * Copyright (c) 2016 Mixmax, Inc
 * https://github.com/mixmaxhq/electron-spell-check-provider
 */

/**
 * Enables spell-checking and the right-click context menu in text editors.
 * Electron (`webFrame.setSpellCheckProvider`) only underlines misspelled words;
 * we must manage the menu ourselves.
 *
 * Run this in the renderer process.
 */
var remote = require('electron').remote;
var webFrame = require('electron').webFrame;
var SpellCheckProvider = require('electron-spell-check-provider');
// `remote.require` since `Menu` is a main-process module.
var buildEditorContextMenu = remote.require('electron-editor-context-menu');

var selection;
function resetSelection() {
  selection = {
    isMisspelled: false,
    spellingSuggestions: []
  };
}
resetSelection();

// Reset the selection when clicking around, before the spell-checker runs and the context menu shows.
window.addEventListener('mousedown', resetSelection);

// The spell-checker runs when the user clicks on text and before the 'contextmenu' event fires.
// Thus, we may retrieve spell-checking suggestions to put in the menu just before it shows.
webFrame.setSpellCheckProvider(
  'en-US',
  // Not sure what this parameter (`autoCorrectWord`) does: https://github.com/atom/electron/issues/4371
  // The documentation for `webFrame.setSpellCheckProvider` passes `true` so we do too.
  true,
  new SpellCheckProvider('en-US').on('misspelling', function(suggestions) {
    // Prime the context menu with spelling suggestions _if_ the user has selected text. Electron
    // may sometimes re-run the spell-check provider for an outdated selection e.g. if the user
    // right-clicks some misspelled text and then an image.
    if (window.getSelection().toString()) {
      selection.isMisspelled = true;
      // Take the first three suggestions if any.
      selection.spellingSuggestions = suggestions.slice(0, 3);
    }
  }));

window.addEventListener('contextmenu', function(e) {
  // Only show the context menu in text editors.
  if (!e.target.closest('textarea, input, [contenteditable="true"]')) return;

  var menu = buildEditorContextMenu(selection);

  // The 'contextmenu' event is emitted after 'selectionchange' has fired but possibly before the
  // visible selection has changed. Try to wait to show the menu until after that, otherwise the
  // visible selection will update after the menu dismisses and look weird.
  setTimeout(function() {
    menu.popup(remote.getCurrentWindow());
  }, 30);
});

