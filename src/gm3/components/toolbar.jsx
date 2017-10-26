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

/** Component for rendering a toolbar!
 *
 */

import React, {Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { startTool } from '../actions/toolbar';

import { startService } from '../actions/service';
import { runAction, setUiHint } from '../actions/ui';

export class ToolbarButton extends Component {

    constructor(props) {
        super(props);
        this.handleToolAction = this.handleToolAction.bind(this);
    }

    handleToolAction() {
        const tool = this.props.tool;
        if(tool.actionType === 'service') {
            // start the service
            this.props.store.dispatch(startService(tool.name));
            // give an indication that a new service has been started
            this.props.store.dispatch(setUiHint('service-start'));
        } else if(tool.actionType === 'action') {
            this.props.store.dispatch(runAction(tool.name));
        }
    }

    render() {
        const tool = this.props.tool;
        return (
            <button onClick={this.handleToolAction} key={tool.name} className={"tool " + tool.name} title={tool.label}>
                <span className="icon"></span><span className="label">{tool.label}</span>
            </button>
        );
    }
}


export class ToolbarDrawer extends Component {

    render() {
        const drawer = this.props.drawer;

        return (
            <div className="drawer tool">
                <span className="drawer icon"></span><span className="label">{drawer.label}</span>
                <div className="drawer-contents">
                {
                    this.props.toolbar[drawer.name].map((tool, i ) => {
                        return (<ToolbarButton store={this.props.store} key={'btn' + i} tool={ tool } />);
                    })
                }
                </div>
            </div>
        );
    }
}


export class Toolbar extends Component {

    render() {
        return (
            <div className="toolbar">
                {
                    this.props.toolbar.root.map((tool, i ) => {
                        if(tool.actionType === 'drawer') {
                            return (<ToolbarDrawer store={this.props.store} drawer={ tool } toolbar={ this.props.toolbar } key={'drawer' + i} />);
                        } else {
                            return (<ToolbarButton store={this.props.store} key={'btn' + i} tool={ tool } />);
                        }
                    })
                }
            </div>
        );
    }
}


const mapToolbarToProps = function(store) {
    return {
        toolbar: store.toolbar
    }
}

export default connect(mapToolbarToProps)(Toolbar);
