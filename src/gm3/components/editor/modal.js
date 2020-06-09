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
                            this.props.source,
                            feature
                        );
                    }}
                >
                    { this.props.t(option.label) }
                </button>
            </div>
        );
    }


    renderBody() {
        return (
            <div className='editor-list'>
                {this.props.properties.map(attr => (
                    <div key={attr.name} className='editor-attribute'>
                        <label>{attr.label}</label>
                        <input
                            value={this.state.properties[attr.name] || ''}
                            onChange={evt => {
                                const properties = Object.assign({},
                                    this.state.properties, {
                                        [attr.name]: evt.target.value,
                                    });
                                this.setState({properties});
                            }}
                        />
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
