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

import React from 'react';
import { Provider, connect } from 'react-redux';
import { Translation } from 'react-i18next';

import { renderFlatTree } from './catalog';
import { isFavorite } from './catalog/layer-favorite';


export class FavoriteLayers extends React.Component {
    render() {
        const is_favorite = (layer) => {
            return isFavorite(this.props.mapSources, layer);
        };

        const favorites = renderFlatTree(this.props.dispatch, this.props.catalog, 'root', is_favorite);

        return (
            <Provider store={this.props.store}>
                <Translation>
                    { t => (
                        <div className="catalog favorites flat">
                            <div
                                className="info-box"
                                dangerouslySetInnerHTML={{ __html: t('favorites-help') }} >
                            </div>
                            {
                                favorites.length > 0 ? '' : (
                                    <i>{t('no-favorites')}</i>
                                )
                            }
                            { favorites }
                        </div>
                    )}
                </Translation>
            </Provider>
        );
    }
}


const mapFavoritesToProps = function(store) {
    return {
        mapSources: store.mapSources,
        catalog: store.catalog
    }
}

export default connect(mapFavoritesToProps)(FavoriteLayers);
