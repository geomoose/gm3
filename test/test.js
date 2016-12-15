/** Demo test application.  
 *
 *  WARNING! ACHTUNG! THIS IS FOR DEVELOPMENT PURPOSES ONLY!!!
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
    mapserver_url: '/mapserver/cgi-bin/mapserv',
    mapfile_root: '/usr/local/geomoose/maps/'
});

app.loadMapbook({url: 'mapbook.xml'}).then(function() {

    app.registerService('identify', IdentifyService);
    app.registerService('search', SearchService);
    
    app.add(gm3.components.Catalog, 'catalog');
    app.add(gm3.components.ServiceManager, 'service-tab', /*hasServices*/ true);
    app.add(gm3.components.Toolbar, 'toolbar');
    app.add(gm3.components.Map, 'map');

    showTab('catalog');

    /** Run a query against the listed map-sources.
     *
     *  @param service   The registered service handling the query.
     *  @param selection A GeoMoose selection description
     *  @param fields    Array of {name:, value:, operation: } of fields to query.
     *  @param layers    Array of layer paths to query against.
     *
    dispatchQuery(service, selection, fields, layers) {
        this.store.dispatch(createQuery(service, selection, fields, layers));
     */
    
    var feature = {
        geometry: {
            type: 'Polygon',
            coordinates: [[ 
                [-10389434,5577792],
                [-10366527,5577656],
                [-10369441,5561594],
                [-10391264,5558748],
                [-10389434,5577792]
                /*
                [-93.3240,44.7230], // top left
                [-93.1358,44.7260], 
                [-93.1764,44.6105], // bottom right
                [-93.3400,44.5261],
                [-93.3240,44.7230]
                */
            ]]
        }
    };

    app.dispatchQuery('identify', null,
        [
            {comparitor: 'ilike', name: 'OWNER_NAME', value: '*Pete*'}
        ],
        ['vector-parcels/ms:parcels']);

});
