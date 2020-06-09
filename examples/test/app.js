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
    mapfile_root: CONFIG.mapfile_root,
    map: {
        scaleLine: {
            enabled: true,
            units: 'imperial'
        }
    }
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

    /*     Configure Site-Specific Components
    ==============================================*/
    app.setView({
        center: app.lonLatToMeters( -93.16, 44.55),
        zoom: 12
    });
    app.registerAction('fullextent', ZoomToAction, {
        extent: [-10742765,5398288,-9920914,6310641]
    });

    var SW = app.lonLatToMeters(-93.3, 44.4);
    var NE = app.lonLatToMeters(-93, 44.7);

    app.add(gm3.components.JumpToExtent, 'jump-to-extent', {
        locations:  [
            {
                label: 'Parcel Boundaries',
//                extent: [minx, miny,maxx, maxy]
                extent: [SW[0], SW[1], NE[0], NE[1]]
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


    /*      Configure Layer-Specific Services
    ======================================================*/
    app.registerService('search-runways', SearchService, {
        fields: [
            {type: 'text', label: 'Name', name: 'Name'},
        ],
        searchLayers: ['ags-vector-polygon/runways'],
        validateFieldValues: function (fields) {
            let nonEmpty = 0;
            const validateFieldValuesResult = {
                valid: true,
                message: null
            };

            if (fields['Name'] !== undefined && fields['Name'] !== '') {
                    nonEmpty++;
            }

            if (nonEmpty === 0) {
                validateFieldValuesResult.valid = false;
                validateFieldValuesResult.message = 'Please complete at least one field.'
            }
            return validateFieldValuesResult;
        }
    });

    app.registerService('search', SearchService, {
        fields: [
            {type: 'text', label: 'Owner Name', name: 'OWNER_NAME'},
            {type: 'text', label: 'Street/Address', name: 'OWN_ADD_L1'},
            {type: 'text', label: 'City/State/ZIP', name: 'OWN_ADD_L3'}
        ],
        searchLayers: ['mapserver-wfs-polygons/parcels'],
        validateFieldValues: function (fields) {
            let nonEmpty = 0;
            const validateFieldValuesResult = {
                valid: true,
                message: null
            };

            if (fields['OWNER_NAME'] !== undefined && fields['OWNER_NAME'] !== '') {
                    nonEmpty++;
            }
            if (fields['OWN_ADD_L1'] !== undefined && fields['OWN_ADD_L1'] !== '') {
                nonEmpty++;
            }
            if (fields['OWN_ADD_L3'] !== undefined && fields['OWN_ADD_L3'] !== '') {
                nonEmpty++;
            }

            if (nonEmpty === 0) {
                validateFieldValuesResult.valid = false;
                validateFieldValuesResult.message = 'Please complete at least one field.'
            }
            return validateFieldValuesResult;
        }
    });

    app.registerService('single-search', SearchService, {
        // The input fields are defined only using one field
        fields: [
            {type: 'text', label: 'Search', name: 'TERM'},
        ],
        prepareFields: function (fields) {
            // this pulls out the term from the search
            const searchTerms = fields[0].value.split(' ');
            // this is the list of fields in the layer which will be searched.
            const searchFields = ['OWNER_NAME', 'OWN_ADD_L1', 'OWN_ADD_L2'];
            // this switched to matching any field
            var query = ['or'];
            for (var i = 0, ii = searchFields.length; i < ii; i++) {
                const subquery = ['and'];
                for (var v = 0, vv = searchTerms.length; v < vv; v++) {
                    const searchTerm = searchTerms[v];
                    subquery.push({
                        comparitor: 'ilike',
                        name: searchFields[i],
                        value: '%' + searchTerm + '%'
                    });
                }
                query.push(subquery);
            }
            return [query];
        },
        searchLayers: ['mapserver-wfs-polygons/parcels'],
        validateFieldValues: function (fields) {
            const validateFieldValuesResult = {
                valid: true,
                message: null
            };
            if (fields['TERM'] === undefined || fields['TERM'] === '') {
                validateFieldValuesResult.valid = false;
                validateFieldValuesResult.message = 'Please complete at least one field.'
            }
            return validateFieldValuesResult;
        },
        zoomToResults: true
    });

    app.registerService('select', SelectService, {
        // set the default layer
        defaultLayer: 'mapserver-wfs-polygons/parcels',
        keepAlive: true,
    });


    /*      Configure Generic Components
    ======================================================*/
    app.registerService('identify', IdentifyService, {
        tools : { 'Box': true, 'Point': true, 'default': 'Box'}
    });

    app.registerService('buffer-select', SelectService, {
        drawToolsLabel: '',
        tools: {'buffer': true},
    });


    // This uses the OpenStreetMap Nominatim geocoder,
    // there is also a BingGeocoder service, but requires
    // signing up for Bing and getting an appropriate usage key.
    app.registerService('geocode', OSMGeocoder, {});
    app.registerAction('findme', FindMeAction);


    /*      Configure GUI Components
    ======================================================*/
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
            pointProjections: point_projections,
            initialUnits: 'mi'
        }
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

    /*      Configure some URL state trackers
    ======================================================*/
    var tracker = new gm3.trackers.LocalStorageTracker(app.store);
    var hash_tracker = new gm3.trackers.HashTracker(app.store);

    tracker.restore();
    hash_tracker.restore();

    tracker.startTracking();
    hash_tracker.startTracking();

    /*      And Finally
    ======================================================*/
    showTab('catalog');
});
