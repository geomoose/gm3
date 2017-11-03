/** Demo test application.
 *
 *  WARNING! ACHTUNG! THIS IS FOR DEVELOPMENT PURPOSES ONLY!!!
 *
 */

/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Dan "Ducky" Little
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

app.uiUpdate = function(ui) {
    // when the UI hint is set for the service manager
    //  show the service manager tab.
    if(ui.hint == 'service-manager' || ui.hint == 'service-start') {
        showTabByName('service-tab');
        app.clearHint();
    }
}

app.loadMapbook({url: 'mapbook.xml'}).then(function() {
    // set the default view.
    app.setView({
        center: [ -10370351.141856, 5550949.728470501 ],
        zoom: 12
    });

    // establish some state trackers
    var tracker = new gm3.trackers.LocalStorageTracker(app.store);
    var hash_tracker = new gm3.trackers.HashTracker(app.store);

    tracker.restore();
    hash_tracker.restore();

    app.addProjection({
        ref: 'EPSG:26915',
        def: '+proj=utm +zone=15 +ellps=GRS80 +datum=NAD83 +units=m +no_defs'
    });

    app.registerService('identify', IdentifyService);
    app.registerService('search', SearchService, {
        fields: [
            {type: 'text', label: 'Owner Name', name: 'OWNER_NAME'},
            {type: 'text', label: 'Street/Address', name: 'OWN_ADD_L1'},
            {type: 'text', label: 'City/State/ZIP', name: 'OWN_ADD_L3'}
        ],
        searchLayers: ['vector-parcels/parcels']
    });

    app.registerService('search-firestations', SearchService, {
        searchLayers: ['firestations/fire_stations'],
        fields: [
            {type: 'text', label: 'Station city', name: 'Dak_GIS__4'}
        ]
    });
    app.registerService('select', SelectService);

    // This uses the OpenStreetMap Nominatim geocoder,
    // there is also a BingGeocoder service, but requires
    // signing up for Bing and getting an appropriate usage key.
    app.registerService('geocode', OSMGeocoder, {});
    app.registerAction('findme', FindMeAction);

    app.registerAction('fullextent', ZoomToAction, {
        extent: [-10742765,5398288,-9920914,6310641]
    });

    app.add(gm3.components.Catalog, 'catalog');
    app.add(gm3.components.Favorites, 'favorites');
    app.add(gm3.components.VisibleLayers, 'visible-layers');
    app.add(gm3.components.Toolbar, 'toolbar');
    app.add(gm3.components.Grid, 'results-grid');
    app.add(gm3.components.Version, 'version');

    var point_projections = [
        {
            label: 'X,Y',
            ref: 'xy'
        },
        {
            label: 'USNG',
            ref: 'usng'
        },
        {
            label: 'Lat,Lon',
            ref: 'latlon'
        }
    ];

    app.add(gm3.components.CoordinateDisplay, 'coordinate-display', {
        projections:  point_projections
    });
    app.add(gm3.components.ServiceManager, 'service-tab', {
        services: true,
        measureToolOptions: {
            pointProjections: point_projections
        }
    });

    app.add(gm3.components.JumpToExtent, 'jump-to-extent', {
        locations:  [
            {
                label: 'Parcel Boundaries',
                extent: [-10384071.6,5538681.6,-10356783.6,5563600.1]
            },
            {
                label: 'Dakota County',
                extent: [-10381354,5545268,-10328765,5608252]
            },
            {
                label: 'Minnesota',
                extent: [-10807000,5440700,-9985100,6345700]
            }
        ]
    });

    app.add(gm3.components.Map, 'map', {});

    var print_preview = app.add(gm3.components.PrintModal, 'print-preview', {});
    app.registerAction('print', function() {
        this.run = function() {
           print_preview.setState({open: true});
        }
    }, {});

    app.registerAction('reload', function() {
        this.run = function() {
            var reload_msg = 'Are you sure you want to start over? All unsaved work will be lost.';
            app.confirm('reload-okay', reload_msg, function(response) {
                if(response === 'confirm') {
                    document.location.hash = '';
                    document.location.reload();
                }
            });
        }
    });


    tracker.startTracking();
    hash_tracker.startTracking();

    showTab('catalog');
});
