
import React, {Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';

import { connect } from 'react-redux';


class Layer extends Component {
    onClick() {
        
    }

    render() {
        return (
            <div className="layer">
                <div className="label">{this.props.data.label}</div>
		<button onClick={this.onClick}>-</button>
            </div>
        )
    }
}

const Group = React.createClass({

    render: function() {
        var subtree = this.props.data.children.map((child) => {
            // this is a bit of duck-typing between Groups and Layers
            if(child.children) {
                return (
                    <Group key={child.id} data={child}/>
                );
            } else {
                return (
                    <Layer key={child.id} data={child}/>
                );
            }
        });

        return (
            <div className="group">
                <div className="label">{this.props.data.label}</div>
                <div className="children">
                {subtree}
                </div>
            </div>
        )
    }

});

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

const Catalog = React.createClass({
    render: function() {
        var tree = populateNode(this.props.catalog, 'root');
        console.log('TREE', tree);
        return (
            <div className="catalog">
                <h3>Catalog X</h3>
                <Group key='root' data={tree}/>
            </div>
        );
    }
});

export default connect(mapCatalogToProps)(Catalog);
