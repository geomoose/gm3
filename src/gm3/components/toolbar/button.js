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

/** React.Component for rendering a toolbar!
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { startService } from '../../actions/service';
import { runAction, setUiHint } from '../../actions/ui';
import { setSelectionBuffer, changeTool } from '../../actions/map';

export const ToolbarButton = ({tool, onClick, currentService, currentDrawTool}) => {
    const {t} = useTranslation();
    const label = t(tool.label);

    const active = (tool.name === currentService);

    return (
        <span
            onClick={() => {
                onClick(tool, currentService, currentDrawTool);
            }}
            key={tool.name}
            className={`${active ? 'active ' : ''}${tool.cssClass || 'tool ' + tool.name}`}
            title={label}
        >
            <span className='icon'></span><span className='label'>{label}</span>
        </span>
    );
}

ToolbarButton.defaultProps = {
    onClick: (tool, currentService) => {
    },
};

ToolbarButton.propTypes = {
    tool: PropTypes.object.isRequired,
    onClick: PropTypes.func,
};

const mapState = state => ({
    currentService: state.query.service,
    currentDrawTool: state.map.interactionType,
});

function mapDispatch(dispatch, ownProps) {
    return {
        onClick: (tool, currentService, currentDrawTool) => {
            if(tool.actionType === 'service') {
                // start the service
                dispatch(startService(tool.name));
                let defaultTool = null;
                if (ownProps.serviceDef
                    && ownProps.serviceDef.tools
                    && ownProps.serviceDef.tools.default
                ) {
                    defaultTool = ownProps.serviceDef.tools.default;
                }

                // reset the buffer if changing tools
                if (tool.name !== currentService) {
                    dispatch(setSelectionBuffer(0));
                    dispatch(changeTool(defaultTool));
                } else if (currentDrawTool === null) {
                    dispatch(changeTool(defaultTool));
                }
                // give an indication that a new service has been started
                dispatch(setUiHint('service-start'));
            } else if(tool.actionType === 'action') {
                dispatch(runAction(tool.name));
            }
        }
    };
}

export default connect(mapState, mapDispatch)(ToolbarButton);
