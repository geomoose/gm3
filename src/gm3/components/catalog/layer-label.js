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

import React, { useCallback } from "react";

import { useControlTitle, mapLayerStateProps, mapLayerDispatchProps } from "./layer-control";
import { connect } from "react-redux";
import MinimalButton from "../MinimalButton";

// if the layer has a "tip" defined, use that for the `title`,
//  otherwise, use the title generated for a layer toggle.
const useTipOrTitle = (on, layer) => {
  const title = useControlTitle(on, layer);
  return layer.tip || title;
};

const LayerLabel = ({ layer, on, catalog, onChange }) => {
  const title = useTipOrTitle(on, layer);
  const handleClick = useCallback(() => {
    onChange(!on, catalog);
  }, [onChange, on, catalog]);

  return (
    <MinimalButton tabindex={-1} title={title} onClick={handleClick}>
      {layer.label}
    </MinimalButton>
  );
};

export default connect(mapLayerStateProps, mapLayerDispatchProps)(LayerLabel);
