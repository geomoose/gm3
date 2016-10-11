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

/** In GeoMoose, the 'Applicaiton' class is the main 'component'
 *
 *  It provides a ES5 API to normalize all the underlaying libraries.
 *
 */

import Request from 'reqwest';

import { createStore, combineReducers } from 'redux';


import * as mapSourceActions from './actions/mapSource';

import { parseCatalog } from './actions/catalog';

import catalogReducer from './reducers/catalog';

import msReducer from './reducers/mapSource';

import React from 'react';
import ReactDOM from 'react-dom';

//import Catalog from './components/catalog';

class Application {

	constructor() {
		this.elements = [];

		// TODO: Combine Reducers here
		this.store = createStore(combineReducers({
			'mapSources' : msReducer,
			'catalog' : catalogReducer
		}));
	}

	add(element)  {
		this.elements.push(element);
	}

    remove() {
        console.log('abcdef');
    }


	populateMapbook(mapbookXml) {
		// load the map-sources
		let sources = mapbookXml.getElementsByTagName('map-source');
		for(let ms of sources) {
            for(let action of mapSourceActions.addFromXml(ms)) {
                this.store.dispatch(action);
            }
		}

		for(let action of parseCatalog(this.store, mapbookXml.getElementsByTagName('catalog')[0])) {
			this.store.dispatch(action);
		}
	}

	loadMapbook(options) {
		var self = this;

		if(options.url) {
			// load mapbook content from a URL,
			//  return the promise in case the user
			//  wants to do something after the mapbook has loaded.
			return Request({
				url: options.url,
				success: (response) => {
					this.populateMapbook(response);
				}
			});

		} else if(options.content) {
			// this is just straight mapbook xml
			//  TODO: Maybe it needs parsed?!?

			this.populateMapbook(options.content);

		}
	}

	render(component, domId) {
		var e = React.createElement(component, {store: this.store});
		ReactDOM.render(e, document.getElementById(domId));
		return e;
	}
/*
	addComponent(component, domId) {
		ReactDOM.render(<Catalog store={this.store} />, document.getElementById('catalog'));
	}
*/
};


export default Application; 
