

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
		var sources = mapbookXml.getElementsByTagName('map-source');
		for(var ms of sources) {
			this.store.dispatch(mapSourceActions.addFromXml(ms));
		}

		for(var action of parseCatalog(mapbookXml.getElementsByTagName('catalog')[0])) {
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
