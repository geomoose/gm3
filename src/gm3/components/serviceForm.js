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
import {withTranslation} from 'react-i18next';

import TextInput from './serviceInputs/text';
import SelectInput from './serviceInputs/select';
import LengthInput from './serviceInputs/length';
import LayersInput from './serviceInputs/layersList';
import BufferInput from './serviceInputs/buffer';

import DrawTool from './drawTool';

function renderServiceField(fieldDef, value, onChange) {
    let InputClass = TextInput;

    if (fieldDef.type === 'select') {
        InputClass = SelectInput;
    } else if (fieldDef.type === 'length') {
        InputClass = LengthInput;
    } else if (fieldDef.type === 'layers-list') {
        InputClass = LayersInput;
    } else if(fieldDef.type === 'hidden') {
        // render nothing and like it.
        return false;
    }

    return (
        <InputClass
            key={fieldDef.name}
            field={fieldDef}
            value={value}
            setValue={onChange}
        />
    );
}

function getDefaultValues(serviceDef) {
    // convert the values to a hash and memoize it into the state.
    const values = {};
    for (let i = 0, ii = serviceDef.fields.length; i < ii; i++) {
        const field = serviceDef.fields[i];
        values[field.name] = field.default;
    }
    return values;
}


class ServiceForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            values: getDefaultValues(this.props.serviceDef),
            validateFieldValuesResultMessage: null,
        };
    }

    submit() {
        const service_def = this.props.serviceDef;

        // validate field values
        let validateFieldValuesResultValid = true;
        let validateFieldValuesResultMessage = null;
        if (service_def.validateFieldValues) {
            const validateFieldValuesResult = service_def.validateFieldValues(this.state.values);
            validateFieldValuesResultValid = validateFieldValuesResult.valid;
            validateFieldValuesResultMessage = validateFieldValuesResult.message;
        }
        if (validateFieldValuesResultValid) {
            this.props.onSubmit(this.state.values);
        }
        // update state validation message
        this.setState( {validateFieldValuesResultMessage} );
    }

    /** Function to handle bashing 'Enter' and causing
     *  the service form to submit.
     *
     *  @param evt The event from the div.
     *
     */
    handleKeyboardShortcuts(evt) {
        const code = evt.which;
        if(code === 13) {
            this.submit();
        } else if(code === 27) {
            this.props.onCancel();
        }
    }

    UNSAFE_componentWillUpdate(nextProps, nextState) {
        if (
            nextProps.serviceDef !== null && (
                this.props.serviceName !== nextProps.serviceName
            )
        ) {
            // 'rotate' the current service to the next services.
            this.setState({
                values: getDefaultValues(nextProps.serviceDef),
                validateFieldValuesResultMessage: null,
            });
        }
    }

    render() {
        const service_def = this.props.serviceDef;

        const show_buffer = service_def.bufferAvailable;

        const draw_tools = [];
        if (service_def.drawToolsLabel) {
            draw_tools.push((<label key='label'>{ service_def.drawToolsLabel }</label>));
        }
        for(const gtype of ['Box', 'Point', 'MultiPoint', 'LineString', 'Polygon', 'Select', 'Modify']) {
            const dt_key = 'draw_tool_' + gtype;
            if(service_def.tools[gtype]) {
                draw_tools.push(<DrawTool key={dt_key} geomType={gtype} />);
            }
        }

        const onChange = (fieldName, value) => {
            const values = Object.assign({}, this.state.values);
            values[fieldName] = value;
            this.setState({values});
        };

        const buffer_input = !show_buffer ? false : (
            <BufferInput key='buffer-input'/>
        );

        const fields = this.props.serviceDef.fields.map((field) => {
            return renderServiceField(field, this.state.values[field.name], onChange);
        });

        let inputs = [];
        if (service_def.fieldsFirst === true) {
            inputs = [fields, draw_tools, buffer_input];
        } else {
            inputs = [draw_tools, buffer_input, fields];
        }

        return (
            <div className='service-form'
                onKeyUp={(evt) => {
                    this.handleKeyboardShortcuts(evt);
                }}
            >

                <h3>{this.props.t(service_def.title)}</h3>
                { inputs }
                {
                    !this.state.validateFieldValuesResultMessage ? false : (
                        <div className="query-error">
                            <div className="error-header">Error</div>
                            <div className="error-contents">
                                { this.state.validateFieldValuesResultMessage }
                            </div>
                        </div>
                    )
                }
                <div className='tab-controls'>
                    <button
                        className='close-button'
                        onClick={() => {
                            this.props.onCancel();
                        }}
                    >
                        <i className='close-icon'></i> {this.props.t('Close')}
                    </button>
                    <button
                        className='go-button'
                        onClick={() => {
                            this.submit();
                        }}
                    >
                        <i className='go-icon'></i> {this.props.t('go')}
                    </button>
                </div>
            </div>
        );
    }
}

export default withTranslation()(ServiceForm);
