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

/** "index" module that ties together all the
 *  submodules of geomoose.  This is what ultimately defines
 *  the public API of GeoMoose.
 *
 */

import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';

import Application from './gm3/application';
import Catalog from './gm3/components/catalog';
import Map from './gm3/components/map';
import Toolbar from './gm3/components/toolbar';
import ServiceManager from './gm3/components/serviceManager';
import Favorites from './gm3/components/favorites';
import VisibleLayers from './gm3/components/visibleLayers';
import Grid from './gm3/components/grid';
import Version from './gm3/components/version';
import CoordinateDisplay from './gm3/components/coordinates';
import MeasureTool from './gm3/components/measure';
import PrintModal from './gm3/components/print/printModal';
import JumpToExtent from './gm3/components/jumpToExtent';

import LocalStorageTracker from './gm3/trackers/localStorage';
import HashTracker from './gm3/trackers/hash';

import * as util from './gm3/util';
import * as jsts from './gm3/jsts';

import proj4 from 'proj4';

import proj from 'ol/proj';

// setup some real proj4 action.
proj.setProj4(proj4);

util.configureProjections(proj4);

var components = {
    Catalog: Catalog,
    Map: Map,
    Toolbar: Toolbar,
    ServiceManager: ServiceManager,
    Favorites: Favorites,
    VisibleLayers: VisibleLayers,
    Grid: Grid,
    Version: Version,
    CoordinateDisplay: CoordinateDisplay,
    MeasureTool: MeasureTool,
    PrintModal: PrintModal,
    JumpToExtent: JumpToExtent
};

var trackers = {
    LocalStorageTracker,
    HashTracker,
};

export {
    Application,
    components,
    trackers,
    util,
    jsts,
};
