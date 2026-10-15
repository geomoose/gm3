/* Small bit of tabs work to make things work.
 *
 * The sidebar switcher follows the WAI-ARIA tabs pattern: one tab
 * stop for the whole group, arrows/Home/End move between views.
 */

function showTab(showId) {
    var contents = document.getElementsByClassName('tab-content');
    for(var i = 0; i < contents.length; i++) {
        contents[i].classList.toggle('show', contents[i].id === showId);
    }

    var tabs = document.getElementsByClassName('tab');
    for(var j = 0; j < tabs.length; j++) {
        var selected = tabs[j].getAttribute('aria-controls') === showId;
        tabs[j].classList.toggle('show', selected);
        tabs[j].setAttribute('aria-selected', selected ? 'true' : 'false');
        tabs[j].tabIndex = selected ? 0 : -1;
    }
}

function showTabByName(tabName) {
    showTab(tabName);
}

document.querySelector('.tabs').addEventListener('keydown', function(evt) {
    var tabs = Array.prototype.slice.call(document.getElementsByClassName('tab'));
    var idx = tabs.indexOf(document.activeElement);
    if(idx < 0) {
        return;
    }

    var next;
    if(evt.key === 'ArrowRight') {
        next = (idx + 1) % tabs.length;
    } else if(evt.key === 'ArrowLeft') {
        next = (idx - 1 + tabs.length) % tabs.length;
    } else if(evt.key === 'Home') {
        next = 0;
    } else if(evt.key === 'End') {
        next = tabs.length - 1;
    } else {
        return;
    }

    evt.preventDefault();
    tabs[next].focus();
    showTab(tabs[next].getAttribute('aria-controls'));
});

function toggleTabs() {
    document.body.classList.toggle('tabs-closed');

    // inform the window that things have moved.
    window.dispatchEvent(new Event('resize'));
}

// F9 shows and hides the pane, as GNOME does for utility panes.
document.addEventListener('keydown', function(evt) {
    if(evt.key === 'F9') {
        evt.preventDefault();
        toggleTabs();
    }
});
