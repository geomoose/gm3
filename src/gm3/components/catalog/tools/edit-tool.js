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
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { setEditPath, setEditTools } from '../../../actions/map';
import { setLayerVisibility } from '../../../actions/mapSource';
import { finishService } from '../../../actions/service';
import { Tool } from '../tools';
import { DRAW_TOOLS } from '../../../defaults';
import { getMapSourceName, getLayerName } from '../../../util';


export const EditTool = ({layer, service, setEditPath, setEditTools, setLayerVisibility, finishService}) => {
    const src = layer.src[0];
    const path = src.mapSourceName + '/' + src.layerName;

    return (
        <Tool
            iconClass="modify"
            tip="draw-open-tip"
            onClick={() => {
                // ensure all the services are stopped
                if (service) {
                    finishService();
                }
                // start the editing mode for this path.
                setEditPath(path);

                // determine which tools are available
                const layerTools = [];
                for (let i = 0, ii = DRAW_TOOLS.length; i < ii; i++) {
                    if (layer.tools.indexOf(DRAW_TOOLS[i]) >= 0) {
                        layerTools.push(DRAW_TOOLS[i]);
                    }
                }
                // set the edit tools.
                setEditTools(layerTools);

                // ensure the layer is on
                setLayerVisibility(getMapSourceName(path), getLayerName(path), true);
            }}
        />
    );
}

EditTool.propTypes = {
    changeTool: PropTypes.func,
    layer: PropTypes.object.isRequired,
};

EditTool.defaultProps = {
    changeTool: () => {
    },
    drawType: 'point',
};

const mapState = state => ({
    service: state.query.service,
});

const mapDispatch = {
    finishService,
    setEditPath,
    setEditTools,
    setLayerVisibility,
};

export default connect(mapState, mapDispatch)(EditTool);
