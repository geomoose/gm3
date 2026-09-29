/*
 * Copyright (c) 2016-2026 Dan "Ducky" Little & GeoMoose.org
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

import { setLayerVisibility } from "../../actions/mapSource";
import { isLayerOn } from "../../util";
import { useTranslation } from "react-i18next";

/**
 * Map a layers current visibility state to a control.
 */
export function mapLayerStateProps(state, ownProps) {
  return {
    catalog: state.catalog,
    on: isLayerOn(state.mapSources, ownProps.layer),
  };
}

/**
 * Connect a control with the ability to toggle the layer on and off
 */
export function mapLayerDispatchProps(dispatch, ownProps) {
  return {
    onChange: (on) => {
      const layer = ownProps.layer;
      // a click on an exclusive (radio) layer always means turning it on;
      //  the setLayerVisibility thunk turns off the rest of its group.
      const nextOn = layer.exclusive === true ? true : on;
      for (let s = 0, ss = layer.src.length; s < ss; s++) {
        const src = layer.src[s];
        dispatch(setLayerVisibility(src.mapSourceName, src.layerName, nextOn));
      }
    },
  };
}

export function useControlTitle(on, layer) {
  const { t } = useTranslation();
  return t(on ? "hide-layer" : "show-layer", { label: layer.label });
}
