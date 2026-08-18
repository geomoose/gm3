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

/*
 * Present the user with a preview of what
 * they will get in a print.
 *
 * This really provides a buffer for the map to load
 * and hopefully the user does not hit "print" until
 * that image is ready.
 */
import React from "react";
import { connect } from "react-redux";
import { Translation } from "react-i18next";

import View from "ol/View";
import { getPointResolution } from "ol/proj";

import jsPDF from "jspdf";
import Mark from "markup-js";

import Modal from "../modal";
import PrintImage from "./printImage";
import PrintPreviewImage from "./printPreviewImage";
import LinearProgress from "../linearProgress";

import { getActiveMapSources } from "../../actions/mapSource";
import { printed } from "../../actions/print";
import { hideModal } from "../../actions/ui";

import { getLegend } from "../map";

import DefaultLayouts from "./printLayouts";

import GeoPdfPlugin from "./geopdf";
import { getScalelineInfo } from "../scaleline";
import drawTable from "./drawTable";

import { FORMAT_OPTIONS } from "../../util";

function loadFonts(fontsUrl) {
  if (fontsUrl) {
    // use fetch
    fetch(fontsUrl, {
      crossOrigin: "anonymous",
    }).then((r) => r.json());
  } else {
    // use the dynamic imports to load the default
    //  fonts.
    return import(/* webpackChunkName: "print-fonts" */ "./fonts");
  }
}

function buildLegendsOnMap(catalog) {
  const legendMap = {};
  for (const key in catalog) {
    if (Array.isArray(catalog[key].src)) {
      const srcs = catalog[key].src;
      for (let i = 0, ii = srcs.length; i < ii; i++) {
        const src = srcs[i];
        if (!legendMap[src.mapSourceName]) {
          legendMap[src.mapSourceName] = {};
        }

        legendMap[src.mapSourceName][src.layerName] =
          !!legendMap[src.mapSourceName][src.layerName] || catalog[key].legend;
      }
    }
  }
  return legendMap;
}

function isLegendEmpty(img) {
  // TODO: Future GeoMoose Devs, switch to offscreen canvas for
  //       better performance. Was not universally supported at time of writing.
  // new OffscreenCanvas(img.width, img.height);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height);

  const firstColor = [data.data[0], data.data[1], data.data[2], data.data[3]];

  for (let i = 4, ii = data.data.length; i < ii; i += 4) {
    for (let x = 0; x < 4; x++) {
      if (data.data[i + x] !== firstColor[x]) {
        return false;
      }
    }
  }
  return true;
}

const toPoints = (n, unit) => {
  let k = 1;

  // this code is borrowed from jsPDF
  //  as it does not expose a public API
  //  for converting units to points.
  switch (unit) {
    case "pt":
      k = 1;
      break;
    case "mm":
      k = 72 / 25.4;
      break;
    case "cm":
      k = 72 / 2.54;
      break;
    case "in":
      k = 72;
      break;
    case "px":
      k = 96 / 72;
      break;
    case "pc":
      k = 12;
      break;
    case "em":
      k = 12;
      break;
    case "ex":
      k = 6;
      break;
    default:
      throw new Error("Invalid unit: " + unit);
  }

  return n * k;
};

// The basemap is assumed to be in meters (the default for web mercator).
// TODO: derive this from state once non-mercator basemaps are supported.
const MAP_PROJECTION = "EPSG:3857";

// Unit conversions used to express scale presets.

const POINTS_PER_INCH = 72;
const INCHES_TO_METERS = 0.0254;

// The ground distance, in meters, that one PDF point of paper represents
//  at 1:1 scale. PDF points (72 per inch) are the print's display unit, so
//  scales are expressed as "meters of ground per point". For a 1:N ratio
//  that is simply N * METERS_PER_POINT.
const METERS_PER_POINT = INCHES_TO_METERS / POINTS_PER_INCH;

// DPI used when rendering a fixed-scale print, expressed as a multiplier
//  of POINTS_PER_INCH (2 => 144 DPI). Fixed scales re-render the map at a
//  scale-derived resolution, so this just controls the image sharpness.
const SCALE_DPI_MULTIPLIER = 2;

// "Fit" presets are always available regardless of configuration. They
//  are a simple DPI multiplier applied to the layout size and render
//  whatever the current map view shows.
const FIT_SCALES = [
  // fit will attempt to place the entire map into the given space
  { value: "fit", label: "Scale to fit", ratio: 1, fit: true },
  { value: "fit-higher", label: "Scale to fit (higher resolution)", ratio: 1.5, fit: true },
  { value: "fit-highest", label: "Scale to fit (highest resolution)", ratio: 2, fit: true },
];

// Fixed scale presets used when the application config does not provide
//  its own (config.print.scales). Each entry carries "metersPerPt": the
//  ground distance, in meters, that one PDF point of paper represents,
//  which for a 1:N ratio is N * METERS_PER_POINT. The map resolution
//  needed to honor the scale is derived at print time, see getPrintMap().
//
// These are the engineering "feet per inch" scales common to US local
//  government work, per the discussion in geomoose/gm3#999. A foot is
//  exactly 12 inches, so every one of them is an exact 1:N ratio:
//  X ft / in == 1:(X * 12).
const DEFAULT_SCALES = [
  { value: "10ft", label: "10 ft / in", metersPerPt: 120 * METERS_PER_POINT },
  { value: "20ft", label: "20 ft / in", metersPerPt: 240 * METERS_PER_POINT },
  { value: "40ft", label: "40 ft / in", metersPerPt: 480 * METERS_PER_POINT },
  { value: "50ft", label: "50 ft / in", metersPerPt: 600 * METERS_PER_POINT },
  { value: "100ft", label: "100 ft / in", metersPerPt: 1200 * METERS_PER_POINT },
  { value: "200ft", label: "200 ft / in", metersPerPt: 2400 * METERS_PER_POINT },
  { value: "300ft", label: "300 ft / in", metersPerPt: 3600 * METERS_PER_POINT },
  { value: "400ft", label: "400 ft / in", metersPerPt: 4800 * METERS_PER_POINT },
  { value: "500ft", label: "500 ft / in", metersPerPt: 6000 * METERS_PER_POINT },
  { value: "600ft", label: "600 ft / in", metersPerPt: 7200 * METERS_PER_POINT },
  { value: "2000ft", label: "2000 ft / in", metersPerPt: 24000 * METERS_PER_POINT },
];

// Normalize a user-supplied scale definition (config.print.scales) into the
//  internal form. A definition declares the scale in one of two ways:
//    { scale: 24000 }       -> a 1:N ratio (the simplest form)
//    { metersPerPt: 0.847 } -> ground meters per PDF point, directly
//  "label" and "value" are optional and derived when omitted. Returns null
//  when neither "scale" nor "metersPerPt" is provided.
function buildScale(def, index) {
  let metersPerPt = null;
  let label = def.label;
  if (def.scale != null) {
    metersPerPt = def.scale * METERS_PER_POINT;
    label = label || `1:${def.scale}`;
  } else if (def.metersPerPt != null) {
    metersPerPt = def.metersPerPt;
  } else {
    return null;
  }

  return {
    value: def.value || label || `scale-${index}`,
    label: label || `scale-${index}`,
    metersPerPt,
  };
}

export class PrintModal extends Modal {
  constructor(props) {
    super(props);
    this.BodyProps = {
      style: {
        maxHeight: "500px",
      },
    };
    this.state = {
      mapTitle: "",
      layout: 0,
      resolution: "fit",
      layouts: props.layouts ? props.layouts : DefaultLayouts,
      includeSelection: "true",
    };
  }

  /* Print the PDF! Or, ya know, close the dialog.
   */
  close(status) {
    if (status === "print") {
      const layout = parseInt(this.state.layout, 10);
      this.makePDF(this.state.layouts[layout]);
      // tell the store that the print is done,
      // this ensures that the memory is freed that was used
      // to store the (sometimes) enormous image.
      this.props.store.dispatch(printed());
    }

    this.props.hideModal();
  }

  /* Return the title for the dialog. */
  getTitle() {
    return "Print";
  }

  /* The substitution values available to layouts, excluding the title.
   *
   * Subclasses (e.g. the feature report) extend this with feature
   * attributes so layouts can reference them as {{PROPERTY}}. Split from
   * getSubstDict because a layout's default title is itself a template that
   * interpolates against these values -- resolving it needs the dictionary
   * without the title already in it.
   */
  getSubstValues() {
    const date = new Date();
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  /* The active layout's own title, interpolated.
   *
   * "title" is a template like any other layout text, so a feature report can
   * title itself "Parcel Report: {{properties.PIN}}". Empty when the layout
   * does not define one.
   */
  getDefaultTitle(values) {
    const layout = this.state.layouts[this.state.layout];
    if (!layout) {
      return "";
    }
    if (!layout.title) {
      return "";
    }
    return Mark.up(layout.title, values, FORMAT_OPTIONS);
  }

  /* The title layouts see as {{title}}.
   *
   * The user's input wins when they typed one; otherwise the layout's
   * default applies. With neither, the title resolves to nothing and addText
   * skips the heading entirely.
   */
  getMapTitle(values) {
    let typed = "";
    if (this.state.mapTitle) {
      typed = this.state.mapTitle.trim();
    }

    if (typed !== "") {
      return typed;
    } else {
      return this.getDefaultTitle(values);
    }
  }

  /* The substitution dictionary used to interpolate text and table cells. */
  getSubstDict() {
    const values = this.getSubstValues();
    return {
      ...values,
      title: this.getMapTitle(values),
    };
  }

  /* Features to draw (measure-styled, with on-map length/area labels) on the
   * print map only. The base print has none; the feature report overrides
   * this to annotate its subject feature. Must return a stable reference
   * across renders (see PrintImage) -- a fresh array each render would thrash
   * the print image.
   */
  getMeasureFeatures() {
    return null;
  }

  /* Units the print-only measure annotations render in ({ lengthUnits,
   * areaUnits }); undefined falls back to feet.
   */
  getMeasureUnits() {
    return undefined;
  }

  addText(doc, def, options = {}) {
    // these are the substitution strings for the map text elements
    const substDict = this.getSubstDict();

    // def needs to define: x, y, text
    const defaults = {
      size: 13,
      color: [0, 0, 0],
      font: "NotoSans",
      fontStyle: "regular",
    };

    // create a new font definition object based on
    //  the combination of the defaults and the definition
    //  passed in by the user.
    const fullDef = Object.assign({}, defaults, def);

    const text = Mark.up(fullDef.text, substDict);

    // a text element that substitutes away to nothing -- the stock layouts'
    //  "{{title}}" heading when the user left the title blank -- is skipped
    //  rather than drawn as an empty string, so the layout does not reserve
    //  space for a heading that is not there.
    if (text.trim() === "") {
      return;
    }

    // set the size
    doc.setFontSize(fullDef.size);
    // the color
    doc.setTextColor(fullDef.color[0], fullDef.color[1], fullDef.color[2]);
    // and the font face.
    doc.setFont(fullDef.font, fullDef.fontStyle);
    // then mark the face.
    doc.text(fullDef.x, fullDef.y, text, options);
  }

  /* Embed an image in the PDF
   */
  addImage(doc, def) {
    // optionally scale the image to fit the space.
    if (def.width && def.height) {
      // image_data is included here for backwards compatibility.
      doc.addImage(def.image_data || def.imageData, def.x, def.y, def.width, def.height);
    } else {
      doc.addImage(def.image_data || def.imageData, def.x, def.y);
    }
  }

  /* Embed legends in the PDF
   */
  addLegends(doc, def) {
    const legendsOnMap = buildLegendsOnMap(this.props.catalog);
    const mapResolution = this.props.mapView.resolution;

    const checkResolution = (ms) => {
      let on = true;
      if (ms.minresolution !== undefined && mapResolution < ms.minresolution) {
        on = false;
      }
      if (ms.maxresolution !== undefined && mapResolution > ms.maxresolution) {
        on = false;
      }
      return on;
    };

    let legends = [];
    for (const mapSourceName in this.props.mapSources) {
      const mapSource = this.props.mapSources[mapSourceName];
      if (checkResolution(mapSource)) {
        const srcLegends = mapSource.layers
          // only render legends for layers that are on
          .filter((layer) => layer.on)
          // Is the legend on
          .filter(
            (layer) => !!legendsOnMap[mapSourceName] && !!legendsOnMap[mapSourceName][layer.name]
          )
          // convert the layer to a legend def
          .map((layer) => getLegend(mapSource, this.props.mapView, layer.name))
          // only image layers are supported.
          .filter((legend) => legend.type === "img")
          .map((legend) => legend.images);

        for (let i = 0, ii = srcLegends.length; i < ii; i++) {
          legends = legends.concat(srcLegends[i]);
        }
      }
    }

    const promises = legends.map(
      (legendSrc) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            resolve(img);
          };
          img.onerror = () => {
            reject();
          };
          img.src = legendSrc;
        })
    );

    return Promise.all(promises).then((images) => {
      let offsetY = 0;
      images
        .filter((img) => {
          // if the image is less than 8 pixels tall, it's likely a placeholder
          return img.height > 8 && !isLegendEmpty(img);
        })
        .forEach((img) => {
          this.addImage(doc, {
            x: def.x,
            y: def.y + offsetY,
            imageData: img,
          });
          offsetY += (img.height + 5) / 96;
        });
    });
  }

  /* Wraps addImage specifically for the map.
   */
  addMapImage(doc, def, layout) {
    const state = this.props.store.getState();

    // this is not a smart component and it doesn't need to be,
    //  so sniffing the state for the current image is just fine.
    this.addImage(doc, Object.assign({}, def, { imageData: state.print.printData }));

    // construct the extents from the map
    const mapView = state.map;

    // mirror the parameters the print image was rendered with so the
    //  georeferencing matches the pixels: a fixed scale re-renders at a
    //  scale-derived resolution, "fit" stays at the current view resolution.
    const printMap = this.getPrintMap();
    const renderResolution =
      printMap.resolution !== null ? printMap.resolution : mapView.resolution;

    const view = new View({
      center: mapView.center,
      resolution: renderResolution,
      projection: MAP_PROJECTION,
    });

    const u = layout.units;
    // the image fills the map element, so its ground extent is just the
    //  pixel size times the render resolution, centered on the map center.
    const mapExtents = view.calculateExtent([printMap.width, printMap.height]);

    const pdfExtents = [def.x, def.y, def.x + def.width, def.y + def.height];
    for (let i = 0; i < pdfExtents.length; i++) {
      pdfExtents[i] = this.toPoints(pdfExtents[i], u);
    }

    // add a scale line
    const scaleLine = state.config.map.scaleLine;
    if (scaleLine && scaleLine.enabled) {
      // the view renders at "render-pixel" resolution; the scale bar is
      //  drawn in PDF points, so scale up by the image's pixels-per-point.
      const scaleInfo = getScalelineInfo(view, scaleLine.units || "us", {
        multiplier: printMap.dpiMultiplier,
      });

      // everything below is sized in points then converted to the layout's
      //  units; ptToLayout converts a measurement in points to layout units.
      const ptToLayout = 1 / this.toPoints(1, layout.units);
      const pt = (n) => n * ptToLayout;
      const margin = pt(12);
      // buffer drawn around the scale line and its label.
      const pad = pt(4);
      // gap between the bottom of the label and the scale line.
      const gap = pt(2);
      const labelSize = 12;
      const labelHeight = pt(labelSize);
      // the end ticks rise from the line to 60% of the label's height.
      const tickHeight = 0.6 * labelHeight;

      // when a fixed scale is chosen, caption the indicator with that
      //  scale's label (e.g. "1:24000"); "Fit" scales have no fixed ratio.
      const scaleDef = this.getScales().find((s) => s.value === this.state.resolution);
      const fixedLabel = scaleDef && !scaleDef.fit ? scaleDef.label : null;

      // the scale line itself, mirroring the OpenLayers scale line: a
      //  horizontal distance line capped with a tick on each end.
      const lineWidth = scaleInfo.width * ptToLayout;

      // measure the labels so the background wraps whichever is wider,
      //  the line or its distance label, plus the optional fixed caption.
      doc.setFont("NotoSans", "regular");
      doc.setFontSize(labelSize);
      const labelWidth = doc.getTextWidth(scaleInfo.label);
      // gap between the scale-line group and the fixed-scale caption.
      const captionGap = pt(8);
      const fixedLabelWidth = fixedLabel ? doc.getTextWidth(fixedLabel) : 0;

      // the scale line and its distance label form the left "group"; the
      //  fixed-scale caption (when present) sits to its right.
      const groupWidth = Math.max(lineWidth, labelWidth);
      const contentWidth = groupWidth + (fixedLabel ? captionGap + fixedLabelWidth : 0);
      const contentHeight = labelHeight + gap;

      const boxWidth = contentWidth + 2 * pad;
      const boxHeight = contentHeight + 2 * pad;

      // anchor the background box in the lower-left corner of the map.
      const boxLeft = def.x + margin;
      const boxBottom = def.y + def.height - margin;
      const boxTop = boxBottom - boxHeight;

      // contrasting background: white with a small rounded corner and a
      //  thin border so the dark scale line reads against the map.
      this.addDrawing(doc, {
        type: "rect",
        filled: true,
        x: boxLeft,
        y: boxTop,
        width: boxWidth,
        height: boxHeight,
        borderRadius: pt(3),
        fill: [255, 255, 255],
        strokeWidth: 0,
        opacity: 0.8,
      });

      // the scale line sits at the bottom of the group, centered on it.
      const groupLeft = boxLeft + pad;
      const lineY = boxBottom - pad;
      const lineLeft = groupLeft + (groupWidth - lineWidth) / 2;
      const lineRight = lineLeft + lineWidth;
      const lineStyle = { type: "line", stroke: [0, 0, 0], strokeWidth: pt(1) };

      // the horizontal distance line ...
      this.addDrawing(doc, { ...lineStyle, x: lineLeft, y: lineY, x2: lineRight, y2: lineY });
      // ... with a tick rising from each end.
      this.addDrawing(doc, {
        ...lineStyle,
        x: lineLeft,
        y: lineY,
        x2: lineLeft,
        y2: lineY - tickHeight,
      });
      this.addDrawing(doc, {
        ...lineStyle,
        x: lineRight,
        y: lineY,
        x2: lineRight,
        y2: lineY - tickHeight,
      });

      // the distance label, centered over the scale-line group.
      this.addText(
        doc,
        {
          x: groupLeft + groupWidth / 2,
          y: lineY - gap,
          text: scaleInfo.label,
          size: labelSize,
          color: [0, 0, 0],
        },
        {
          align: "center",
          baseline: "bottom",
        }
      );

      // the fixed-scale caption, vertically centered to the right.
      if (fixedLabel) {
        this.addText(
          doc,
          {
            x: groupLeft + groupWidth + captionGap,
            y: boxTop + boxHeight / 2,
            text: fixedLabel,
            size: labelSize,
            color: [0, 0, 0],
          },
          {
            align: "left",
            baseline: "middle",
          }
        );
      }
    }

    doc.setGeoArea(pdfExtents, mapExtents);
  }

  /* Draw a shape on the map.
   *
   * Supported shapes: rect, ellipse, line
   *
   * rect honors optional rounded corners via def.borderRadius (used as
   *  both the x and y corner radius).
   * line draws from (def.x, def.y) to (def.x2, def.y2).
   */
  addDrawing(doc, def) {
    // determine the style string
    let style = "S";
    if (def.filled) {
      style = "DF";
      const fill = def.fill ? def.fill : [255, 255, 255];
      doc.setFillColor(fill[0], fill[1], fill[2]);
    }

    if (def.opacity) {
      const scopedOpacity = new doc.GState({ opacity: def.opacity });
      doc.setGState(scopedOpacity);
    }

    // set the stroke width
    const strokeWidth = def.strokeWidth !== undefined ? def.strokeWidth : this.toPoints(1, "px");
    if (strokeWidth > 0) {
      const stroke = def.stroke ? def.stroke : [0, 0, 0];
      doc.setLineWidth(strokeWidth);
      doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
    } else {
      style = "F";
      doc.setLineWidth(0);
    }

    // draw the shape.
    if (def.type === "rect") {
      // when a corner radius is supplied, draw a rounded rectangle using
      //  borderRadius for both the x and y corner radii.
      if (def.borderRadius != null) {
        doc.roundedRect(
          def.x,
          def.y,
          def.width,
          def.height,
          def.borderRadius,
          def.borderRadius,
          style
        );
      } else {
        doc.rect(def.x, def.y, def.width, def.height, style);
      }
    } else if (def.type === "ellipse") {
      doc.ellipse(def.x, def.y, def.rx, def.ry, style);
    } else if (def.type === "line") {
      // lines are stroke-only; a zero stroke width would render nothing.
      doc.line(def.x, def.y, def.x2, def.y2, "S");
    }

    // reset to 1
    if (def.opacity) {
      doc.setGState(new doc.GState({ opacity: 1.0 }));
    }
  }

  /* Resolve the column/row arrays for a "table" element from a bound data
   * source (e.g. a selected feature or the results set).
   *
   * The base print has no feature/results context, so it returns null and
   * only inline-row tables render. The feature report overrides this to
   * supply data-driven rows. Returns { columns, rows } or null.
   */
  resolveTableData(_element) {
    return null;
  }

  /* Render a "table" element.
   *
   * Two data sources are supported, with inline winning:
   *   - element.rows: a literal 2D array straight from the layout, each
   *     cell interpolated against the substitution dictionary.
   *   - a bound source resolved by resolveTableData() (feature/results).
   *
   * The heavy lifting (widths, wrapping, striping, pagination) lives in the
   * pure drawTable() primitive; this method only resolves the data and the
   * page geometry.
   */
  addTable(doc, element) {
    let columns, rows;
    if (element.rows) {
      const substDict = this.getSubstDict();
      columns = element.columns || [];
      rows = element.rows.map((row) =>
        row.map((cell) => Mark.up(String(cell), substDict, FORMAT_OPTIONS))
      );
    } else {
      const data = this.resolveTableData(element);
      if (!data) {
        return;
      }
      columns = data.columns;
      rows = data.rows;
    }

    // the bottom of the printable area; tables paginate against this. The
    //  bottom margin mirrors the element's left inset unless overridden.
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = element.marginBottom != null ? element.marginBottom : element.x || 0;

    drawTable(doc, {
      x: element.x,
      y: element.y,
      width: element.width,
      columns,
      rows,
      rowHeight: element.rowHeight,
      header: element.header,
      stripe: element.stripe,
      pageBottom: pageHeight - marginBottom,
      pageTop: marginBottom,
      // use the embedded print font; it is registered with a "regular"
      //  (rather than "normal") style, see makePDF().
      font: element.font || "NotoSans",
      bodyStyle: element.bodyStyle || "regular",
      headerStyle: element.headerStyle || "bold",
      fontSize: element.fontSize,
      color: element.color,
    });
  }

  /**
   * Convert units to PDF units
   *
   */
  toPoints(n, unit) {
    return toPoints(n, unit);
  }

  makePDF(layout) {
    // check for and install the geopdf plugin
    if (!jsPDF.API.setGeoArea) {
      GeoPdfPlugin(jsPDF.API);
    }
    // new PDF document
    const doc = new jsPDF(layout.orientation, layout.units, layout.page);
    loadFonts(this.props.fontIndexUrl).then((fontIndex) => {
      for (const fontName in fontIndex.FONTS) {
        // add the file to the VFS
        doc.addFileToVFS(fontName, fontIndex.FONTS[fontName]);
        // add the font.
        const parts = fontName.replace(".ttf", "").split("-");
        doc.addFont(fontName, parts[0], parts[1].toLowerCase());
      }

      this.paintPDF(doc, layout);
    });
  }

  paintPDF(doc, layout) {
    let promises = [];

    // iterate through the elements of the layout
    //  and place them in the document.
    for (const element of layout.elements) {
      switch (element.type) {
        case "text":
          this.addText(doc, element);
          break;
        case "map":
          this.addMapImage(doc, element, layout);
          break;
        case "image":
          this.addImage(doc, element);
          break;
        case "rect":
        case "ellipse":
        case "line":
          this.addDrawing(doc, element);
          break;
        case "table":
          this.addTable(doc, element);
          break;
        case "legend":
          promises = promises.concat(this.addLegends(doc, element));
          break;
        default:
        // pass, do nothing.
      }
    }

    Promise.all(promises).then(() => {
      // kick it back out to the user.
      doc.save("print_" + new Date().getTime() + ".pdf");
    });
  }

  renderFooter() {
    const disabled = !this.props.printData;

    const buttons = [
      this.renderOption({ value: "dismiss", label: "Cancel", disabled }),
      this.renderOption({ value: "print", label: "Print", disabled }),
    ];

    return <div className={this.getFooterClass(2)}>{buttons}</div>;
  }

  /* The full list of scale options shown to the user.
   *
   * The "Fit" options are always present; the fixed scales come from the
   * application config (config.print.scales) when provided. When scales are
   * omitted the built-in defaults are used; an explicit empty array yields
   * the "Fit" options only.
   *
   * @return An array of scale definitions.
   */
  getScales() {
    const configScales = this.props.printScales;
    const fixedScales =
      configScales === undefined
        ? DEFAULT_SCALES
        : configScales.map((def, i) => buildScale(def, i)).filter((scale) => scale !== null);
    return [...FIT_SCALES, ...fixedScales];
  }

  /* The rendering parameters for the print map.
   *
   * The map image always fills the layout's map element at a fixed pixel
   * size (set by the print DPI), so honoring a requested scale is a matter
   * of rendering the map at the right resolution: a re-render centered on
   * the current map center recomputes the extent so the fixed-size image
   * covers exactly the ground distance the scale demands.
   *
   *   width (px)     = toPoints(mapWidth) * dpiMultiplier
   *   resolution     = metersPerPt / dpiMultiplier   (ground meters/pixel)
   *
   * "fit" scales have no fixed ground distance, so they render at the
   * current map view resolution (resolution === null).
   *
   * @return { width, height, resolution, dpiMultiplier }
   *   width/height in pixels, resolution in meters/pixel (or null to use
   *   the current map view resolution), dpiMultiplier as image px per point.
   */
  getPrintMap() {
    const layout = this.state.layouts[this.state.layout];
    const scales = this.getScales();
    const scaleDef = scales.find((s) => s.value === this.state.resolution) || scales[0];

    // "fit" scales are a simple DPI multiplier on the layout size; fixed
    //  scales render at a constant, print-quality DPI.
    const dpiMultiplier = scaleDef.fit ? scaleDef.ratio : SCALE_DPI_MULTIPLIER;

    // locate the map element in the layout.
    let mapElement = null;
    for (const element of layout.elements) {
      if (element.type === "map") {
        mapElement = element;
        break;
      }
    }

    // the resolution (meters/pixel) to re-render the map at; null means
    //  "leave the map at its current view resolution".
    let resolution = null;
    if (!scaleDef.fit) {
      // the image renders at dpiMultiplier pixels per PDF point, so the
      //  ground distance each pixel must cover is the per-point distance
      //  spread across those pixels.
      const groundResolution = scaleDef.metersPerPt / dpiMultiplier;
      // web mercator (EPSG:3857) stretches distances by latitude, so the
      //  view resolution OL renders with is not true ground meters. Convert
      //  the desired ground resolution into a projected one at the map
      //  center; this also keeps the scale bar (which corrects the same
      //  way) in agreement with the printed map.
      const projectionFactor = getPointResolution(
        MAP_PROJECTION,
        1,
        this.props.mapView.center,
        "m"
      );
      resolution = groundResolution / projectionFactor;
    }

    return {
      width: this.toPoints(mapElement.width, layout.units) * dpiMultiplier,
      height: this.toPoints(mapElement.height, layout.units) * dpiMultiplier,
      resolution,
      dpiMultiplier,
    };
  }

  /** Render a select box with the layouts.
   */
  renderLayoutSelect(t) {
    return (
      <select
        onChange={(evt) => {
          this.setState({ layout: evt.target.value });
        }}
        value={this.state.layout}
      >
        {this.state.layouts.map((layout, idx) => (
          <option key={layout.label} value={idx}>
            {t(`page-${layout.label}`)}
          </option>
        ))}
      </select>
    );
  }

  /** Render the layout picker row.
   *
   *  Split out from renderBody so subclasses that choose the layout
   *  themselves (the feature report) can drop the row entirely.
   */
  renderLayoutRow(t) {
    return (
      <p>
        <label>{`${t("page-layout")}:`}</label>
        {this.renderLayoutSelect(t)}
      </p>
    );
  }

  /** Render the map title row.
   *
   *  The row is dropped for layouts that set "allowTitleOverride": false,
   *  which fix their own heading and would discard whatever the user typed.
   *  Otherwise the input is optional: leaving it blank falls back to the
   *  layout's default title, which the placeholder previews.
   */
  renderTitleRow(t) {
    const layout = this.state.layouts[this.state.layout];
    if (layout && layout.allowTitleOverride === false) {
      return null;
    }

    // preview the layout's default in the box, so it is clear what leaving
    //  it empty will produce.
    let placeholder = t("map-title");
    const defaultTitle = this.getDefaultTitle(this.getSubstValues());
    if (defaultTitle !== "") {
      placeholder = defaultTitle;
    }

    return (
      <p>
        <label>{`${t("map-title")}:`}</label>
        <input
          placeholder={placeholder}
          value={this.state.mapTitle}
          onChange={(evt) => {
            this.setState({ mapTitle: evt.target.value });
          }}
        />
      </p>
    );
  }

  /** Render a select drop down that allows the user
   *  to up the DPI.
   */
  renderResolutionSelect(_t) {
    return (
      <select
        onChange={(evt) => {
          this.setState({
            resolution: evt.target.value,
          });
        }}
        value={this.state.resolution}
      >
        {this.getScales().map((scaleDef) => (
          // TODO: Add i18n definitions for the scales
          <option key={scaleDef.value} value={scaleDef.value}>
            {scaleDef.label}
          </option>
        ))}
      </select>
    );
  }

  /** Choose whether to include the selected layers in the output.
   */
  renderIncludeSelection(t) {
    return (
      <select
        onChange={(evt) => {
          this.setState({
            includeSelection: evt.target.value,
          });
        }}
        value={this.state.includeSelection}
      >
        <option value="true">{t("yes")}</option>
        <option value="false">{t("no")}</option>
      </select>
    );
  }

  renderBody() {
    // small set of CSS hacks to keep the print map
    //  invisible but drawn.
    const mapStyleHack = {
      visibility: "hidden",
      zIndex: -1,
      position: "absolute",
      top: 0,
      left: 0,
    };

    // get the number of all map-sources.
    const allMs = getActiveMapSources(this.props.store).length;
    // not get the number of printable map-sources.
    const printableMs = getActiveMapSources(this.props.store, true).length;

    // if there are fewer printable map-sources than there
    //  are active map-sources then inform the user they will lose some
    //  layers in the print.
    let printWarning = false;
    if (printableMs < allMs) {
      printWarning = (
        <div className="info-box">
          Some of the map layers cannot be printed. The map image in the resulting PDF may differ
          from what is seen in the map viewer.
        </div>
      );
    }

    const mapSize = this.getPrintMap();
    return (
      <div>
        {printWarning}

        <Translation>
          {(t) => (
            <div>
              {this.renderTitleRow(t)}
              {this.renderLayoutRow(t)}
              <p>
                <label>{`${t("resolution")}:`}</label>
                {this.renderResolutionSelect(t)}
              </p>
              <p>
                <label>{`${t("include-selection")}:`}</label>
                {this.renderIncludeSelection(t)}
              </p>
            </div>
          )}
        </Translation>

        {!this.props.printData && <LinearProgress />}

        <div>
          <PrintPreviewImage printData={this.props.printData} />
        </div>

        <div style={mapStyleHack}>
          <PrintImage
            width={mapSize.width}
            height={mapSize.height}
            resolution={mapSize.resolution}
            store={this.props.store}
            includeSelection={this.state.includeSelection === "true"}
            measureFeatures={this.getMeasureFeatures()}
            measureUnits={this.getMeasureUnits()}
          />
        </div>
      </div>
    );
  }
}

/* Base state mapping shared with subclasses (e.g. the feature report).
 *
 * Subclasses spread this and override "open" plus add their own props.
 */
export const mapStateToProps = (state) => ({
  mapSources: state.mapSources,
  open: state.ui.modal === "print",
  mapView: state.map,
  printData: state.print.printData,
  catalog: state.catalog,
  printScales: state.config.print ? state.config.print.scales : undefined,
});

const mapDispatchToProps = {
  hideModal,
};

export default connect(mapStateToProps, mapDispatchToProps)(PrintModal);
