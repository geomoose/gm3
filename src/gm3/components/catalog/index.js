/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Dan 'Ducky' Little
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/** The big bopper of all the GeoMoose React.Components, the Catalog.
 *
 *  This is the most exercised component of GeoMoose and serves
 *  as the 'dispatch' center to the map, presenting the layers
 *  of the mapbook in a nice tree format.
 */

import React from 'react';
import { Translation } from 'react-i18next';

import { connect, Provider } from 'react-redux';

import { setGroupExpand } from '../../actions/catalog';

import CatalogGroup from './group';
import CatalogLayer from './layer';

function allLayers() {
    return true;
}

export function renderTree(dispatch, tree, id, filter = allLayers) {
    const node = tree[id];

    if(node.children) {
        return (
            <CatalogGroup
                key={id}
                group={node}
                onExpand={() => {
                    dispatch(setGroupExpand(id, node.expand !== true));
                }}
            >
                { node.children.map(child_id => renderTree(dispatch, tree, child_id, filter)) }
            </CatalogGroup>
        );
    } else {
        if (filter(node)) {
            return (
                <CatalogLayer
                    key={id}
                    layer={node}
                />
            );
        } else {
            return false;
        }
    }
}

export function renderFlatTree(dispatch, tree, id, filter = allLayers) {
    const node = tree[id];

    let elements = [];

    if(node.children) {
        for(let i = 0, ii = node.children.length; i < ii; i++) {
            const sublayers = renderFlatTree(dispatch, tree, node.children[i], filter);
            if (sublayers.length > 0) {
                elements = elements.concat(sublayers);
            }
        }
    } else {
        if (filter(node)) {
            elements.push((
                <CatalogLayer
                    key={id}
                    layer={node}
                />
            ));
        }
    }

    return elements;
}



export class Catalog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            searchFilter: ''
        };
    }

    render() {
        const catalog_classes = this.props.showSearch ? 'catalog searchable' : 'catalog';

        const filter = (layer) => {
            if(this.state.searchFilter !== '') {
                // searchFilter is always lower case!
                // If the search filter is in the title then return true.
                return (layer.label.toLowerCase().indexOf(this.state.searchFilter) >= 0);
            }
            return true;
        };

        return (
            <Provider store={this.props.store}>
                <div className={ catalog_classes }>
                    { this.props.showSearch && (
                        <div className='searchbox'>
                            <Translation>
                                {t => (
                                    <input
                                        onChange={(evt) => {
                                            this.setState({searchFilter: evt.target.value.toLowerCase()});
                                        }}
                                        placeholder={t('search-catalog')}
                                    />
                                )}
                            </Translation>
                        </div>
                    )}
                    {
                        this.state.searchFilter === '' ?
                            this.props.catalog.root.children.map(child_id => renderTree(this.props.dispatch, this.props.catalog, child_id)) :
                            this.props.catalog.root.children.map(child_id => renderFlatTree(this.props.dispatch, this.props.catalog, child_id, filter))
                    }
                </div>
            </Provider>
        );
    }
}

Catalog.defaultProps = {
    showSearch: true,
}

const mapCatalogToProps = function(store) {
    return {
        mapSources: store.mapSources,
        catalog: store.catalog
    }
}

export default connect(mapCatalogToProps)(Catalog);
