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
import { connect, Provider } from 'react-redux';

import ToolbarButton from './button';
import ToolbarDrawer from './drawer';

export class Toolbar extends React.Component {
    render() {
        return (
            <Provider store={this.props.store}>
                <div className='toolbar'>
                    {
                        this.props.toolbar.root.map((tool) => {
                            if(tool.actionType === 'drawer') {
                                return (
                                    <ToolbarDrawer
                                        key={ tool.name }
                                        label={ tool.label }
                                        tools={ this.props.toolbar[tool.name] }
                                        services={ this.props.services }
                                    />
                                );
                            } else {
                                return (
                                    <ToolbarButton
                                        tool={ tool }
                                        key={ tool.name }
                                        serviceDef={
                                            tool.actionType === 'service' ? this.props.services[tool.name] : undefined
                                        }
                                    />
                                );
                            }
                        })
                    }
                </div>
            </Provider>
        );
    }
}


const mapToolbarToProps = function(state) {
    return {
        toolbar: state.toolbar,
    }
}

export default connect(mapToolbarToProps)(Toolbar);
