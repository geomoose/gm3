/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2022 Dan "Ducky" Little
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

import React from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";

import TextInput from "./serviceInputs/text";
import SelectInput from "./serviceInputs/select";
import LengthInput from "./serviceInputs/length";
import LayersInput, { getLayerOptions } from "./serviceInputs/layersList";
import BufferInput from "./serviceInputs/buffer";

import DrawTool from "./drawTool";

function renderServiceField(fieldDef, value, onChange, isFirst = false) {
  let InputClass = TextInput;

  if (fieldDef.type === "select") {
    InputClass = SelectInput;
  } else if (fieldDef.type === "length") {
    InputClass = LengthInput;
  } else if (fieldDef.type === "layers-list") {
    InputClass = LayersInput;
  } else if (fieldDef.type === "hidden") {
    // render nothing and like it.
    return false;
  }

  return (
    <InputClass
      isFirst={isFirst}
      key={fieldDef.name}
      field={fieldDef}
      value={value}
      setValue={onChange}
    />
  );
}

function getDefaultValues(serviceDef, mapSources, defaultValues = {}) {
  // convert the values to a hash and memoize it into the state.
  const values = {};
  for (let i = 0, ii = serviceDef.fields.length; i < ii; i++) {
    const field = serviceDef.fields[i];
    values[field.name] = defaultValues[field.name] || field.default;
    if (field.type === "select" || field.type === "layers-list") {
      // normalize the options list for both select and layer input types
      const options =
        field.type === "select"
          ? field.options
          : getLayerOptions(field.filter, mapSources);
      // ensure the default value is valid
      const isDefaultValid =
        !!values[field.name] &&
        options.filter((option) => option.value === values[field.name]).length >
          0;

      // if the default is not valid, then choose the first option in the list
      if (!isDefaultValid && options.length > 0) {
        values[field.name] = options[0].value;
      }
    }
  }
  return values;
}

class ServiceForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      values: getDefaultValues(
        this.props.serviceDef,
        this.props.mapSources,
        this.props.defaultValues
      ),
      validateFieldValuesResultMessage: null,
    };

    this.firstInputRef = null;

    this.handleKeyboard = this.handleKeyboardShortcuts.bind(this);
    this.setValue = this.setValue.bind(this);
  }

  submit() {
    const serviceDef = this.props.serviceDef;
    // validate field values
    let validateFieldValuesResultValid = true;
    let validateFieldValuesResultMessage = null;
    if (serviceDef.validateFieldValues) {
      const validateFieldValuesResult = serviceDef.validateFieldValues(
        this.state.values
      );
      validateFieldValuesResultValid = validateFieldValuesResult.valid;
      validateFieldValuesResultMessage = validateFieldValuesResult.message;
    }
    if (validateFieldValuesResultValid) {
      this.props.onSubmit(this.state.values);
    } else {
      // update state validation message
      this.setState({ validateFieldValuesResultMessage });
    }
  }

  /** Function to handle bashing 'Enter' and causing
   *  the service form to submit.
   *
   *  @param evt The event from the div.
   *
   */
  handleKeyboardShortcuts(evt) {
    const code = evt.which;
    if (code === 13) {
      this.submit();
    } else if (code === 27) {
      this.props.onCancel();
    }
  }

  setValue(fieldName, value) {
    const nextValues = {
      ...this.state.values,
      [fieldName]: value,
    };
    this.setState({
      values: nextValues,
    });
  }

  resetDefaultValues() {
    this.setState({
      values: getDefaultValues(
        this.props.serviceDef,
        this.props.mapSources,
        this.props.defaultValues
      ),
      validateFieldValuesResultMessage: null,
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.serviceName !== this.props.serviceName) {
      this.resetDefaultValues();
    } else {
      // if there was a service change, don't accidentally submit
      //  the old geometry on the new service.
      if (
        this.props.serviceDef.autoGo &&
        this.props.selectionFeatures.length > 0
      ) {
        this.props.onSubmit(this.state.values);
      }
    }
  }

  componentDidMount() {
    document.addEventListener("keyup", this.handleKeyboard);
  }

  componentWillUnmount() {
    document.removeEventListener("keyup", this.handleKeyboard);
  }

  render() {
    const serviceDef = this.props.serviceDef;

    const showBuffer = serviceDef.bufferAvailable;

    const drawTools = [];
    if (serviceDef.drawToolsLabel) {
      drawTools.push(<label key="label">{serviceDef.drawToolsLabel}</label>);
    }
    for (const gtype of [
      "Box",
      "Point",
      "MultiPoint",
      "LineString",
      "Polygon",
      "Select",
      "Modify",
    ]) {
      if (serviceDef.tools[gtype]) {
        drawTools.push(<DrawTool key={gtype} geomType={gtype} />);
      }
    }

    const bufferInput = !showBuffer ? (
      false
    ) : (
      <BufferInput key="buffer-input" />
    );

    const fields = this.props.serviceDef.fields.map((field, idx) => {
      return renderServiceField(
        field,
        this.state.values[field.name],
        this.setValue,
        idx === 0
      );
    });

    let inputs = [];
    if (serviceDef.fieldsFirst === true) {
      inputs = [fields, drawTools, bufferInput];
    } else {
      inputs = [drawTools, bufferInput, fields];
    }

    return (
      <div className="service-form">
        <h3>{this.props.t(serviceDef.title)}</h3>
        {inputs}
        {!this.state.validateFieldValuesResultMessage ? (
          false
        ) : (
          <div className="query-error">
            <div className="error-header">Error</div>
            <div className="error-contents">
              {this.state.validateFieldValuesResultMessage}
            </div>
          </div>
        )}
        <div className="tab-controls">
          <button
            className="close-button"
            onClick={() => {
              this.props.onCancel();
            }}
          >
            <i className="close-icon"></i> {this.props.t("Close")}
          </button>
          <button
            className="go-button"
            onClick={() => {
              this.submit();
            }}
          >
            <i className="go-icon"></i> {this.props.t("go")}
          </button>
        </div>
      </div>
    );
  }
}

ServiceForm.defaultProps = {
  defaultValues: {},
};

const mapStateToProps = (state) => ({
  mapSources: state.mapSources,
  selectionFeatures: state.mapSources.selection
    ? state.mapSources.selection.features
    : [],
});

export default connect(mapStateToProps)(withTranslation()(ServiceForm));
