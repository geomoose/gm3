import React from 'react';
import {withTranslation} from 'react-i18next';

import Modal from '../modal';

const isNumberType = type => (type === 'number' || type === 'range');

const getDefaultValue = attr => {
    const numeric = isNumberType(attr.type);
    if (attr.default) {
        return numeric ? parseFloat(attr.default) : attr.default;
    } else if (numeric) {
        return 0;
    } else {
        return '';
    }
}

const getDefaultProperties = attributes => {
    const properties = {};
    attributes.forEach(attr => {
        properties[attr.name] = getDefaultValue(attr);
    });
    return properties;
};

export class EditorModal extends Modal {
    constructor(props) {
        super(props);
        this.state = {
            properties: null,
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.feature !== this.props.feature) {
            const defaultProperties = getDefaultProperties(this.props.properties);
            const featureProperties = this.props.feature && this.props.feature.properties;
            this.setState({
                properties: {
                    ...defaultProperties,
                    ...featureProperties,
                },
            });
        }
    }

    /** Option rendering is overridden to pass properties
     *  into onClose.
     */
    renderOption(option) {
        return (
            <div
                className="button-parent"
                key={option.value }
            >
                <button
                    onClick={() => {
                        const feature = Object.assign({},
                            this.props.feature,
                            {
                                properties: this.state.properties,
                            });

                        this.props.onClose(
                            option.value,
                            this.props.path,
                            feature
                        );
                    }}
                >
                    { this.props.t(option.label) }
                </button>
            </div>
        );
    }

    renderInput(attr) {
        const type = attr.type;
        const propValue = this.state.properties[attr.name];
        const currentValue = propValue === undefined ? getDefaultValue(attr) : propValue;

        const props = {
            type,
            value: currentValue,
            onChange: evt => {
                const newValue = isNumberType(type)
                    ? parseFloat(evt.target.value)
                    : evt.target.value;

                const properties = Object.assign({},
                    this.state.properties, {
                        [attr.name]: newValue,
                    });
                this.setState({properties});
            },
        };

        if (type === 'range' || type === 'number') {
            ['min', 'max', 'step']
                .forEach(prop => {
                    if (attr[prop] !== undefined) {
                        props[prop] = attr[prop];
                    }
                });
        }

        if (type === 'select') {
            return (
                <select {...props}>
                    {attr.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        return (
            <input
                {...props}
            />
        );
    }


    renderBody() {
        return (
            <div className='editor-list'>
                {this.state.properties && this.props.properties.map(attr => (
                    <div key={attr.name} className='editor-attribute'>
                        <label>{attr.label}</label>
                        {this.renderInput(attr)}
                    </div>
                ))}
            </div>
        );
    }
}

EditorModal.defaultProps = {
    attributes: [],
    options: [
        {label: 'Close', value: 'close'},
        {label: 'save-changes', value: 'save'},
    ],
};

export default withTranslation()(EditorModal);
