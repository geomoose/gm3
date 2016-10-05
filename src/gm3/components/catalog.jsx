
import React, {Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';

import { connect } from 'react-redux';

import { MAPSOURCE } from '../actionTypes';

const identityMapper = function(child) {
    return child;
}

class Layer extends Component {
    onClick() {
        console.log('click on the button', this.props.data);
    }

    toggleLayer() {
        for(let src in this.props.data.src) {
            this.props.store.dispatch({
                type: MAPSOURCE.LAYER_VIS,
                layerName: src.layerName,
                mapSourceName: src.mapSourceName,
                on: !this.props.data.on
            })
        }
            
    }

    constructor() {
        super();

        this.onClick = this.onClick.bind(this);
        this.toggleLayer = this.toggleLayer.bind(this);
    }

    render() {
        return (
            <div className="layer">
                <div className="layer-label">{this.props.data.label}</div>
                <button onClick={this.toggleLayer}>{this.props.data.on ? 'on' : 'off'}</button>
            </div>
        )
    }
}

class Group extends Component {

    render() {
        let subtree = this.props.data.children.map((child) => {
            // this is a bit of duck-typing between Groups and Layers
            if(child.children) {
                return (
                    <Group key={child.id} store={this.props.store} data={child}/>
                );
            } else {
                return (
                    <Layer key={child.id} store={this.props.store} data={child}/>
                );
            }
        });
        return (
            <div className="group">
                <div className="group-label">{this.props.data.label}</div>
                <div className="children">
                {subtree}
                </div>
            </div>
        )
    }

}

const mapCatalogToProps = function(store) {
    return {
        catalog: store.catalog
    }
}


function populateNode(catalog, nodeId) {
    var tree = Object.assign({}, catalog[nodeId]);
    if(tree.children) {
        var new_ch = [];
        
        for(var childId of tree.children) {
            var ch = catalog[childId];
            if(ch.children) {
                new_ch.push(Object.assign({}, populateNode(catalog, childId)));
            } else {
                new_ch.push(Object.assign({}, ch));
            }
        }
        tree.children = new_ch;
    } 

    return tree;
}

class Catalog extends Component {
    render() {
        let tree = populateNode(this.props.catalog, 'root');

        return (
            <div className="catalog">
                <h3>Catalog X</h3>
                <Group key='root' store={this.props.store} data={tree}/>
            </div>
        );
    }
}

export default connect(mapCatalogToProps)(Catalog);
