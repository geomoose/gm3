/** Demo mobile application.
 *
 */

/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 GeoMoose
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


var app = new gm3.Application({
    mapserver_url: CONFIG.mapserver_url,
    mapfile_root: CONFIG.mapfile_root
});

function changeTab(tabName) {
    $('#tabs .tab-content')
        .toggleClass('hidden', true);

    $('#' + tabName)
        .toggleClass('hidden', false);

    $('#tabs')
        .toggleClass('show', tabName !== 'map');

    $('.navbar .nav-item')
        .removeClass('active');

    $('.navbar a[data-tab="' + tabName + '"]')
        .parent()
        .addClass('active');
}

app.uiUpdate = function(ui) {
    // when the UI hint is set for the service manager
    //  show the service manager tab.
    if (ui.hint === 'new-results') {
        changeTab('service-tab');
        app.clearHint();
    }
}

app.loadMapbook({url: 'mapbook.xml'}).then(function() {
    // set the default view.
    app.setView({
        center: [ -10370351.141856, 5550949.728470501 ],
        zoom: 12
    });

    app.registerService('identify', IdentifyService);
    app.registerAction('findme', FindMeAction);

    app.add(gm3.components.Catalog, 'catalog');
    app.add(gm3.components.Map, 'map');
    app.add(gm3.components.Favorites, 'favorites');
    app.add(gm3.components.ServiceManager, 'service-tab', {
        services: true
    });

    $('.nav-item .nav-link')
        .on('click', evt => {
            const tab = evt.currentTarget.getAttribute('data-tab');
            changeTab(tab);
        });

    // setup the Find Me button to find the user and
    //  go there on the map.
    $('#findme-btn').on('click', function() {
        // start the action
        app.startAction('findme');
        // head back to the map.
        changeTab('map');
    });

    // kick off an idenify.
    $('#identify-btn').on('click', function() {
        app.startService('identify', {changeTool: 'Point'});
        changeTab('map');
    });

    changeTab('map');
});
