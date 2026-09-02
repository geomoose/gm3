/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2023 Dan "Ducky" Little
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

import { Circle, Fill, Style, Stroke } from "ol/style";
import { createLayer as createVectorLayer, updateLayer as updateVectorLayer } from "./vector";
import { getMeasureLabelStyles } from "../../measure/labels";

/* Build the style function for the measure layer.
 *
 * @param {Function} getLabelOptions Returns the current on-map label options,
 *   `{ enabled, units }`.  It is read on every render so that toggling the
 *   opt-in or switching units takes effect without re-creating the layer.
 */
const applyMeasureStyle = (layer, getLabelOptions) => {
  layer.setStyle((feature) => {
    const geometry = feature.getGeometry();
    const { outlineColor, coreColor } = feature.getProperties();

    if (geometry.getType() === "Point") {
      return new Style({
        image: new Circle({
          radius: 7,
          fill: new Fill({
            color: coreColor,
          }),
          stroke: new Stroke({
            color: outlineColor,
            width: 3,
          }),
        }),
      });
    }

    const styles = [
      new Style({
        stroke: new Stroke({
          color: outlineColor,
          width: 7,
        }),
      }),
      new Style({
        stroke: new Stroke({
          color: coreColor,
          width: 3,
        }),
      }),
    ];

    const labelOptions = getLabelOptions ? getLabelOptions() : null;
    if (labelOptions && labelOptions.enabled) {
      styles.push(...getMeasureLabelStyles(geometry, labelOptions));
    }

    return styles;
  });
};

export const createLayer = (mapSource, getLabelOptions) => {
  return createVectorLayer(mapSource, (layer) => applyMeasureStyle(layer, getLabelOptions));
};

export const updateLayer = (map, layer, mapSource, mapTool, getLabelOptions) => {
  return updateVectorLayer(map, layer, mapSource, mapTool, (styledLayer) =>
    applyMeasureStyle(styledLayer, getLabelOptions)
  );
};
