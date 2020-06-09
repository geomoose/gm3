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

/**
 * Service input type for specifying length
 * - Renders a numeric text input and a select-list of units
 * - User-specified length is converted to its equivalent in meters and stored
 *   in the component state
 *
 * @extends TextInput
 */

import React, {useState, useEffect} from 'react';
import { useTranslation } from 'react-i18next';

import TextInput, {getId} from './text';

const UNITS = [
    'ft', 'yd', 'mi', 'in', 'm', 'km', 'ch'
];

export const LengthInputBase = ({label, value, units, onChange}) => {
    const id = 'input-' + getId();
    const [tmpValue, setValue] = useState(value);
    const {t} = useTranslation();

    useEffect(() => {
        setValue(value);
    }, [value]);

    return (
        <div className="service-input length">
            <label htmlFor={id}>{label}</label>
            <input
                className="measure"
                onChange={evt => {
                    setValue(evt.target.value);
                    const asFloat = parseFloat(evt.target.value);
                    if (!isNaN(asFloat)) {
                        onChange(asFloat, units);
                    }
                }}
                id={id}
                value={tmpValue}
            />
            <select
                className="units"
                onChange={evt => {
                    onChange(value, evt.target.value);
                }}
                value={units}
            >
                {UNITS.map(unit => (
                    <option key={unit} value={unit}>{t(`units-${unit}`)}</option>
                ))}
            </select>
        </div>
    );
}


export default class LengthInput extends TextInput {
    constructor(props) {
        super(props);

        // default the units to feet, if nothing is specified.
        const default_units = props.field.units ? props.field.units : 'ft';
        const default_value = props.field.default ? props.field.default : 0;

        this.value = default_value;
        this.selected_units = default_units;

        this.onUnitsChanged = this.onUnitsChanged.bind(this);
        this.onValueChanged = this.onValueChanged.bind(this);

        this.state = {
            value: default_value,
            units: default_units,
        };
    }

    onChange(value, units) {
        if(!isNaN(this.state.value)) {
            this.setValue(this.getName(), {
                distance: this.state.value,
                units: this.state.units,
            });
        }
    }

    /** Whenever the units change, update the units setting.
     */
    onUnitsChanged(evt) {
        const units = evt.target.value;
        this.onChange(this.state.value, units);
        this.setState({units, });
    }

    /** Whenever the input box changes, parse the value and update it.
     */
    onValueChanged(evt) {
        const value = parseFloat(evt.target.value);
        this.onChange(value, this.state.units);
        this.setState({value, });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.field !== this.props.field) {
            this.setState({
                value: this.props.field.default,
                units: this.props.field.units,
            });
        }
    }

    render() {
        return (
            <LengthInputBase
                label={this.props.field.label}
                value={this.state.value}
                units={this.state.units}
                onChange={(value, units) => {
                    this.onChange(value, units);
                    this.setState({value, units});
                }}
            />
        );
    }
}
