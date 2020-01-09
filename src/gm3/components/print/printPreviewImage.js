/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Dan "Ducky" Little
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
import { connect } from 'react-redux';

class PrintPreviewImage extends React.Component {

    constructor(props) {
        super(props);

        // TODO: Get the image size from the props.
        this.state = {
            size: {
                width: 600,
                height: 400
            }
        };
    }

    render() {
        const print_data = this.props.print.printData;

        if(print_data) {
            if(print_data.substring(0, 3) === 'err') {
                return (<div className='error-message'>
                    There was an error generating the print image.<br/>
                    This is likely due to a cross-origin/CORS error with a map-source
                    which is being served from an external server. Check:
                    <ol>
                        <li>The server supports cross-origin requests.</li>
                        <li>That the cross-origin param is set in the mapbook.</li>
                        <li>
                            If the server does not support cross-origin requests, set the map-source's printable
                            attribute to false.
                        </li>
                    </ol>
                </div>);
            } else {
                return (
                    <div style={{textAlign: 'center'}}>
                        <img
                            height={150} style={{border: 'solid 1px #333', maxWidth: '100%'}} alt='map preview' src={print_data}
                        />
                    </div>
                );
            }

        }
        return (
            <div style={{textAlign: 'center'}}>
                <div
                    style={{
                        border: 'solid 1px black',
                        width: '100px',
                        height: '150px',
                    }}
                >
                </div>
            </div>
        );
    }
}


const mapToProps = function(store) {
    return {
        print: store.print
    }
}

export default connect(mapToProps)(PrintPreviewImage);
