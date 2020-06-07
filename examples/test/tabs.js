/* Small bit of tabs work to make things work.
 */

function showTab(showId, event) {
    var active = 'show';

    var add_class_fn = function(e, class_name) {
        e.className += ' ' + class_name;
    }

    var rm_class_fn = function(e, class_name) {
        e.className = e.className.replace(' '+class_name, '');
    }


    var contents = document.getElementsByClassName("tab-content");
    for(var i = 0; i < contents.length; i++) {
        rm_class_fn(contents[i], active);
    }


    if(event && event.currentTarget) {
        var tabs = document.getElementsByClassName("tab");
        for(var i = 0; i < tabs.length; i++) {
            rm_class_fn(tabs[i], active);
        }

        add_class_fn(event.currentTarget, active);
    }
    add_class_fn(document.getElementById(showId), active);
}

function showTabByName(tabName) {
    var target = document.getElementById(tabName+'-tab');
    showTab(tabName, {currentTarget: target});
}

function toggleTabs() {
    var e = document.getElementsByTagName('body')[0];
    if(e.className.indexOf('tabs-closed') >= 0) {
        e.className = e.className.replace(' tabs-closed', '');
    } else {
        e.className += ' tabs-closed';
    }

    // inform the window that things have moved.
    window.dispatchEvent(new Event('resize'));
}
