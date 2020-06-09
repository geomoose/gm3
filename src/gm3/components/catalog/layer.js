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
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import ClearTool from './tools/clear';
import DownTool from './tools/down';
import DownloadTool from './tools/download';
import DrawTool from './tools/draw-tool';
import FadeTool from './tools/fade';
import LegendToggle from './tools/legend';
import MetadataTool from './tools/metadata';
import RefreshTool from './tools/refresh';
import UnfadeTool from './tools/unfade';
import UpTool from './tools/up';
import UploadTool from './tools/upload';
import ZoomToTool from './tools/zoomto';

import Legend from './legend';
import LayerCheckbox from './layer-checkbox';
import LayerFavorite from './layer-favorite';

export class CatalogLayer extends React.Component {
    /* Convert the tool definitions to components.
     */
    getTools(layer, enabledTools) {
        const tools = [];
        for(const tool_name of enabledTools) {
            const key = layer.id + '_' + tool_name;

            switch(tool_name) {
                case 'up':
                    tools.push(<UpTool key={key} layer={layer} />);
                    break;
                case 'down':
                    tools.push(<DownTool key={key} layer={layer} />);
                    break;
                case 'fade':
                    tools.push(<FadeTool key={key} layer={layer} />);
                    break;
                case 'unfade':
                    tools.push(<UnfadeTool key={key} layer={layer} />);
                    break;
                case 'zoomto':
                    tools.push(<ZoomToTool key={key} layer={layer} />);
                    break;
                case 'upload':
                    tools.push(<UploadTool key={key} layer={layer} />);
                    break;
                case 'download':
                    tools.push(<DownloadTool key={key} layer={layer} />);
                    break;
                case 'clear':
                    tools.push(<ClearTool key={key} layer={layer} />);
                    break;

                case 'draw-point':
                case 'draw-polygon':
                case 'draw-line':
                case 'draw-modify':
                case 'draw-remove':
                case 'draw-edit':
                    const draw_type = tool_name.split('-')[1];
                    tools.push(<DrawTool drawType={draw_type} key={key} layer={layer} />);
                    break;
                case 'legend-toggle':
                    tools.push(<LegendToggle layer={layer} key={key} />);
                    break;
                default:
                    // pass
            }
        }
        return tools;
    }

    getToolsForLayer(layer) {
        return this.getTools(layer, layer.tools.concat(this.props.forceTools));
    }

    render() {
        const layer = this.props.layer;

        const layer_classes = ['layer'];
        if(layer.on) {
            layer_classes.push('on');
        }

        if((layer.minresolution || layer.maxresolution) && this.props.resolution) {
            const min_z = layer.minresolution !== undefined ? layer.minresolution : -1;
            const max_z = layer.maxresolution !== undefined ? layer.maxresolution : 1000;
            if (this.props.resolution < min_z || this.props.resolution > max_z) {
                layer_classes.push('out-of-resolution');
            }
        }

        const tools = this.getToolsForLayer(layer);

        return (
            <div key={layer.id} className={layer_classes.join(' ')}>
                <div className='layer-label' title={layer.tip}>
                    <LayerCheckbox layer={layer} />
                    <LayerFavorite layer={layer} />
                    <span>
                        {layer.label}
                    </span>
                    {
                        (layer.refresh === null) ? false : (
                            <RefreshTool layer={layer} />
                        )
                    }
                    {
                        !layer.metadata_url ? false : (
                            <MetadataTool href={layer.metadata_url} />
                        )
                    }
                </div>
                <div className='layer-tools'>
                    {tools}
                </div>
                {
                    !layer.legend ? false : (
                        <Legend layer={layer} />
                    )
                }
            </div>
        );
    }
}

CatalogLayer.propTypes = {
    forceTools: PropTypes.array,
};

CatalogLayer.defaultProps = {
    forceTools: [],
};

function mapState(state) {
    return {
        resolution: state.map ? state.map.resolution : -1,
    };
}

export default connect(mapState)(CatalogLayer);
