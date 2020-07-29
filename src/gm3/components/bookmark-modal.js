/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2020 Dan "Ducky" Little
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
import {connect} from 'react-redux';
import {showModal} from '../actions/ui';

import Modal from './modal';

class BookmarkModal extends Modal {
    renderBody() {
        return (
            <div>
                <label>This url can be copied and pasted to make a bookmark:</label>
                <a href={'' + document.location} target = "_blank" rel="noopener noreferrer"> Map Link</a>
                <textarea
                    style={{
                        width: '100%',
                        height: '200px',
                        fontFamily: 'mono',
                    }}
                    defaultValue={'' + document.location}
                />
            </div>
        );
    }
}

BookmarkModal.defaultProps = {
    title: 'Bookmark',
    options: [{
        value: 'close',
        label: 'Close',
    }],
};

const mapStateToProps = state => ({
    open: state.ui.modal === 'bookmark',
});

const mapDispatchToProps = dispatch => ({
    onClose: () => {
        dispatch(showModal(''));
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(BookmarkModal);
