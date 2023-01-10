/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2019 Dan "Ducky" Little
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
import { connect } from "react-redux";

import SelectInput from "./select";

import { getQueryableLayers, getLayerByPath } from "../../actions/mapSource";

// special list of layers that should never float to the top.
const TO_THE_BOTTOM = ["sketch/default"];

export const getLayerOptions = (inputFilter, mapSources) => {
  const layers =
    inputFilter && inputFilter.layers
      ? inputFilter.layers
      : getQueryableLayers(mapSources, inputFilter);

  return layers
    .map((path) => {
      const layer = getLayerByPath(mapSources, path);
      return {
        value: path,
        label: layer.label,
      };
    })
    .sort((a, b) => {
      if (TO_THE_BOTTOM.indexOf(a.value) >= 0) {
        return 1;
      } else if (TO_THE_BOTTOM.indexOf(b.value) >= 0) {
        return -1;
      }
      return a < b ? -1 : 1;
    });
};

export class LayersListInput extends SelectInput {
  getOptions() {
    return getLayerOptions(this.props.field?.filter, this.props.mapSources);
  }
}

function mapState(state, ownProps) {
  return {
    mapSources: state.mapSources,
  };
}

export default connect(mapState)(LayersListInput);
