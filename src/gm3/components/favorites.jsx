

import { connect } from 'react-redux';
import React, {Component, PropTypes } from 'react';

import { Catalog } from './catalog';


class FavoriteLayers extends Catalog {

    constructor() {
        super();
    }

    renderTreeNode(childId) {
        let node = this.props.catalog[childId];
        if(!node.children && node.favorite) {
            return this.renderLayer(node);
        }
        return '';
    }

    render() {
        return (
            <div className="catalog favorites flat">
                {
                    Object.keys(this.props.catalog).map(this.renderTreeNode)
                }
            </div>
        );
    }
}


const mapFavoritesToProps = function(store) {
    return {
        catalog: store.catalog
    }
}

export default connect(mapFavoritesToProps)(FavoriteLayers);
