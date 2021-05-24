/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017, 2021 Dan "Ducky" Little
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

const PrintPreviewImage = ({printData}) => {
    if (printData && printData.substring(0, 3) === 'err') {
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
    }
    return (
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div
                style={{
                    border: 'solid 1px #333',
                    minHeight: '100px',
                    maxHeight: '180px',
                    minWidth: '150px',
                    maxWidth: '100%',
                    display: 'flex',
                }}
            >
                {printData && (
                    <img
                        style={{maxWidth: '100%', maxHeight: '100%'}}
                        alt='map preview'
                        src={printData}
                    />
                )}
            </div>
        </div>
    );
}


const mapToProps = state => ({
    printData: state.print.printData,
});

export default connect(mapToProps)(PrintPreviewImage);
