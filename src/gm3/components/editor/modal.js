import React from 'react';
import {withTranslation} from 'react-i18next';

import Modal from '../modal';

export class EditorModal extends Modal {
    constructor(props) {
        super(props);
        this.state = {
            properties: {},
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.feature !== this.props.feature) {
            this.setState({
                properties: Object.assign({}, this.props.feature ? this.props.feature.properties : {}),
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
        const isNumberType = type === 'number' || type === 'range';
        const defaultValue = (this.props.isNew && attr.default)
            ? attr.default
            : isNumberType ? 0 : '';
        const currentValue = this.state.properties[attr.name];

        const props = {
            type,
            value: currentValue === undefined ? defaultValue : currentValue,
            onChange: evt => {
                const newValue = isNumberType
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

        return (
            <input
                {...props}
            />
        );
    }


    renderBody() {
        return (
            <div className='editor-list'>
                {this.props.properties.map(attr => (
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
