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

import { DRAW_TOOLS } from '../../defaults';
import ClearTool from './tools/clear';
import DownTool from './tools/down';
import DownloadTool from './tools/download';
import EditTool from './tools/edit-tool';
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

const getTools = (layer, enabledTools) => {
    const tools = [];
    for (let i = 0, ii = enabledTools.length; i < ii; i++) {
        const toolName = enabledTools[i];
        const key = layer.id + '_' + toolName;
        switch (toolName) {
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
            case 'legend-toggle':
                tools.push(<LegendToggle layer={layer} key={key} />);
                break;
            default:
                // pass, no actions.
        }
    }
    return tools;
}

const getEnabledTools = (layer, forceTools) => layer.tools.concat(forceTools);

const canEdit = (enabledTools) =>
    enabledTools.filter(tool => DRAW_TOOLS.indexOf(tool) >= 0).length > 0

export const CatalogLayer = ({layer, resolution, forceTools}) => {
    const layer_classes = ['layer'];
    if (layer.on) {
        layer_classes.push('on');
    }
    if (layer.classNames) {
        layer_classes.push(layer.classNames);
    }

    if ((layer.minresolution || layer.maxresolution) && resolution) {
        const min_z = layer.minresolution !== undefined ? layer.minresolution : -1;
        const max_z = layer.maxresolution !== undefined ? layer.maxresolution : 1000;
        if (resolution < min_z || resolution > max_z) {
            layer_classes.push('out-of-resolution');
        }
    }

    const enabledTools = getEnabledTools(layer, forceTools);

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
                { getTools(layer, enabledTools) }
                { canEdit(enabledTools) && <EditTool layer={layer} /> }
            </div>
            {
                !layer.legend ? false : (
                    <Legend layer={layer} />
                )
            }
        </div>
    );
}

CatalogLayer.propTypes = {
    forceTools: PropTypes.array,
};

CatalogLayer.defaultProps = {
    forceTools: [],
};

export default CatalogLayer;
