/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2024 Dan "Ducky" Little
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

/*
 * The feature report reuses the entire print pipeline (layouts, scale
 * selection, georeferenced map image, fonts) and adds two things:
 *   - feature attributes in the text/table substitution dictionary, and
 *   - data-bound "table" elements driven by the selected feature or the
 *     whole results set.
 *
 * Everything print-specific (scale bar, map georeferencing, PDF assembly)
 * is inherited unchanged from PrintModal.
 */
import { connect } from "react-redux";

import Mark from "markup-js";

import { PrintModal, mapStateToProps as printStateToProps } from "../print/printModal";

import { hideModal } from "../../actions/ui";
import { getReportData } from "../../selectors/report";
import { getLayerFromPath } from "../../actions/mapSource";
import { FORMAT_OPTIONS } from "../../util";
import { colorizeFromIndex } from "../measure/colorize";

import DefaultReportLayouts from "./reportLayouts";

/* Parse a layout template's contents (object or JSON string) into an array
 * of layouts. Returns null when it cannot be parsed.
 */
function parseLayouts(contents) {
  let parsed = contents;
  if (typeof contents === "string") {
    try {
      parsed = JSON.parse(contents);
    } catch {
      return null;
    }
  }
  if (!parsed) {
    return null;
  }
  return Array.isArray(parsed) ? parsed : [parsed];
}

export class ReportModal extends PrintModal {
  /* Keep the layout list in sync: which layout applies depends on the layer
   * whose report is open, so layouts arrive via props and change over time
   * (unlike the static print layouts set once in the constructor). The
   * default layout is also chosen to match the report mode (a single feature
   * vs. the whole results set).
   */
  componentDidUpdate(prevProps) {
    if (super.componentDidUpdate) {
      super.componentDidUpdate(prevProps);
    }
    const layoutsChanged = prevProps.layouts !== this.props.layouts;
    const modeChanged = this.getReportMode(prevProps) !== this.getReportMode(this.props);
    if (layoutsChanged || modeChanged) {
      this.setState({
        layouts: this.props.layouts,
        layout: this.pickLayoutForMode(this.props.layouts, this.getReportMode(this.props)),
      });
    }
  }

  getReportMode(props) {
    return props.report ? props.report.mode : "feature";
  }

  /* Choose the layout whose table binding matches the report mode: a
   * "results" layout for a results report, otherwise a feature layout.
   * Falls back to the first layout.
   */
  pickLayoutForMode(layouts, mode) {
    const wantsResults = mode === "results";
    const idx = (layouts || []).findIndex((layout) =>
      (layout.elements || []).some(
        (el) => el.type === "table" && (el.data === "results") === wantsResults
      )
    );
    return idx >= 0 ? idx : 0;
  }

  getTitle() {
    return "Feature Report";
  }

  /* The report's layout is picked from the report mode (a single feature vs.
   * the whole results set), not by the user, so the print modal's layout
   * picker is dropped.
   */
  renderLayoutRow() {
    return null;
  }

  /* Extend the print substitution values with the report feature's
   * attributes so layouts can reference {{PROPERTY}} (or {{properties.X}})
   * directly -- including from a layout's default "title". Reserved print
   * tokens (the date parts) win over attribute names.
   */
  getSubstValues() {
    const base = super.getSubstValues();
    const data = this.props.report;
    const feature = data && data.feature;
    if (!feature) {
      return base;
    }
    return {
      ...feature.properties,
      ...base,
      properties: feature.properties,
    };
  }

  /* The active report definition (the currently selected layout). */
  getReportDefinition() {
    return (this.state.layouts && this.state.layouts[this.state.layout]) || {};
  }

  /* When the report definition opts in via "showMeasurements", annotate the
   * subject feature on the print map exactly like the measure tool: the
   * feature is colorized and rendered (measure-styled geometry plus on-map
   * length/area labels) by the print map's measure layer. It is never added
   * to the shared map state, so it stays off the interactive map.
   *
   * Memoized so each render hands the print map a stable array reference
   * (see PrintModal.getMeasureFeatures).
   */
  getMeasureFeatures() {
    const def = this.getReportDefinition();
    const feature = this.props.report && this.props.report.feature;
    if (!def.showMeasurements || !feature || !feature.geometry) {
      this._measureCache = null;
      return null;
    }
    if (
      this._measureCache &&
      this._measureCache.feature === feature &&
      this._measureCache.layout === this.state.layout
    ) {
      return this._measureCache.result;
    }
    const result = [
      {
        ...feature,
        properties: {
          ...feature.properties,
          ...colorizeFromIndex(0),
        },
      },
    ];
    this._measureCache = { feature, layout: this.state.layout, result };
    return result;
  }

  /* Units the on-map measurement annotations render in, taken from the report
   * definition (defaulting to feet). Memoized to a stable reference.
   */
  getMeasureUnits() {
    const def = this.getReportDefinition();
    const lengthUnits = def.lengthUnits || "ft";
    const areaUnits = def.areaUnits || "ft";
    if (
      this._unitsCache &&
      this._unitsCache.lengthUnits === lengthUnits &&
      this._unitsCache.areaUnits === areaUnits
    ) {
      return this._unitsCache;
    }
    this._unitsCache = { lengthUnits, areaUnits };
    return this._unitsCache;
  }

  /* Resolve a "table" element's column definitions.
   *
   * "columns" may be an inline array, the name of one of the layer's
   * templates (e.g. "select-grid-columns"), or omitted entirely -- in which
   * case the feature's own attribute keys are used. Columns without a
   * "property" (e.g. an actions column) are dropped.
   */
  getColumnDefs(element, feature) {
    const spec = element.columns;
    let colDefs = null;
    if (typeof spec === "string") {
      colDefs = this.getLayerTemplateJSON(spec);
    } else if (Array.isArray(spec)) {
      colDefs = spec;
    }

    if (Array.isArray(colDefs)) {
      return colDefs.filter((col) => col.property);
    }

    const skipProperties = ["boundedBy", "_uuid"];

    // no column spec: list every attribute of the feature.
    if (feature) {
      return Object.keys(feature.properties)
        .filter((property) => !skipProperties.includes(property))
        .map((property) => ({
          property,
          title: property,
        }));
    }
    return [];
  }

  /* Read and parse a JSON layer template (column definitions) by name. */
  getLayerTemplateJSON(name) {
    const layer = this.props.layer;
    const template = layer && layer.templates && layer.templates[name];
    if (!template) {
      return [];
    }
    if (typeof template.contents === "object") {
      return template.contents;
    }
    try {
      return JSON.parse(template.contents);
    } catch {
      return [];
    }
  }

  /* Bind a "table" element to the report feature or results set.
   *
   * - transpose (or "feature" with transpose): one label/value row per field.
   * - "feature": a single row of the subject feature.
   * - "results": one row per feature in the results set.
   */
  resolveTableData(element) {
    const data = this.props.report;
    if (!data) {
      return null;
    }
    const { feature, results, mode } = data;
    const effectiveMode = element.data || mode || "feature";

    const colDefs = this.getColumnDefs(element, feature);
    const fmt = (col, f) => {
      const fStr = `{{ properties.${col.property} }}`;
      return Mark.up(col.format || fStr, f, FORMAT_OPTIONS);
    };

    if (element.transpose) {
      if (!feature) {
        return null;
      }
      return {
        columns: [
          { title: element.labelTitle || "", width: element.labelWidth },
          { title: element.valueTitle || "", align: element.valueAlign },
        ],
        rows: colDefs.map((col) => [col.title || col.property, fmt(col, feature)]),
      };
    }

    const columns = colDefs.map((col) => ({
      title: col.title,
      width: col.width,
      align: col.align,
    }));

    if (effectiveMode === "results") {
      return {
        columns,
        rows: (results || []).map((f) => colDefs.map((col) => fmt(col, f))),
      };
    }

    // single-feature, non-transposed: one row.
    if (!feature) {
      return null;
    }
    return { columns, rows: [colDefs.map((col) => fmt(col, feature))] };
  }
}

/* Resolve the report layouts for the currently targeted layer: the layer's
 * own "report" template when present, otherwise the built-in default.
 */
function getReportLayouts(state, reportData) {
  if (reportData && reportData.layerPath) {
    let layer = null;
    try {
      layer = getLayerFromPath(state.mapSources, reportData.layerPath);
    } catch {
      layer = null;
    }
    const template = layer && layer.templates && layer.templates.report;
    if (template) {
      const layouts = parseLayouts(template.contents);
      if (layouts) {
        return layouts;
      }
    }
  }
  return DefaultReportLayouts;
}

const mapStateToProps = (state) => {
  const reportData = getReportData(state);
  let layer = null;
  if (reportData && reportData.layerPath) {
    try {
      layer = getLayerFromPath(state.mapSources, reportData.layerPath);
    } catch {
      layer = null;
    }
  }
  return {
    ...printStateToProps(state),
    open: state.ui.modal === "report",
    report: reportData,
    layer,
    layouts: getReportLayouts(state, reportData),
  };
};

const mapDispatchToProps = {
  hideModal,
};

export default connect(mapStateToProps, mapDispatchToProps)(ReportModal);
