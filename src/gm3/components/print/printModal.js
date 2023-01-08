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
      resolution: 1,
      layouts: props.layouts ? props.layouts : DefaultLayouts,
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

  addText(doc, def, options = {}) {
    // these are the subsitution strings for the map text elements
    const date = new Date();
    const substDict = {
      title: this.state.mapTitle,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };

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

    // set the size
    doc.setFontSize(fullDef.size);
    // the color
    doc.setTextColor(fullDef.color[0], fullDef.color[1], fullDef.color[2]);
    // and the font face.
    doc.setFont(fullDef.font, fullDef.fontStyle);
    // then mark the face.
    doc.text(fullDef.x, fullDef.y, Mark.up(fullDef.text, substDict), options);
  }

  /* Embed an image in the PDF
   */
  addImage(doc, def) {
    // optionally scale the image to fit the space.
    if (def.width && def.height) {
      doc.addImage(def.imageData, def.x, def.y, def.width, def.height);
    } else {
      doc.addImage(def.imageData, def.x, def.y);
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
            (layer) =>
              !!legendsOnMap[mapSourceName] &&
              !!legendsOnMap[mapSourceName][layer.name]
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

    const promises = [];
    legends.forEach((legendSrc) => {
      const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve(img);
        };
        img.onerror = () => {
          reject();
        };
        img.src = legendSrc;
      });
      promises.push(promise);
    });

    return Promise.all(promises).then((images) => {
      let offsetY = 0;
      images.forEach((img) => {
        this.addImage(doc, {
          x: def.x,
          y: def.y + offsetY,
          imageData: img,
        });
        offsetY += (img.height + 5) / 72;
      });
    });
  }

  /* Wraps addImage specifically for the map.
   */
  addMapImage(doc, def, layout) {
    const state = this.props.store.getState();

    // this is not a smart component and it doesn't need to be,
    //  so sniffing the state for the current image is just fine.
    this.addImage(
      doc,
      Object.assign({}, def, { imageData: state.print.printData })
    );

    // construct the extents from the map
    const mapView = state.map;
    // TODO: get this from state
    const mapProj = "EPSG:3857";

    const view = new View({
      center: mapView.center,
      resolution: mapView.resolution,
      projection: mapProj,
    });

    const u = layout.units;
    const resolution = parseFloat(this.state.resolution);
    const mapExtents = view.calculateExtent([
      this.toPoints(def.width, u) * resolution,
      this.toPoints(def.height, u) * resolution,
    ]);

    const pdfExtents = [def.x, def.y, def.x + def.width, def.y + def.height];
    for (let i = 0; i < pdfExtents.length; i++) {
      pdfExtents[i] = this.toPoints(pdfExtents[i], u);
    }

    // add a scale line
    const scaleLine = state.config.map.scaleLine;
    if (scaleLine && scaleLine.enabled) {
      const scaleInfo = getScalelineInfo(view, scaleLine.units || "us", {
        multiplier: resolution,
      });
      const ptToLayout = 1 / this.toPoints(1, layout.units);
      const margin = 12 * ptToLayout;
      const height = 12 * ptToLayout;
      this.addDrawing(doc, {
        type: "rect",
        filled: true,
        // place this in the lower left corner of the map
        x: def.x + margin,
        y: def.y + def.height - margin - height,
        // width info comes as points, this
        //  should convert the width
        width: scaleInfo.width * ptToLayout,
        height,
        strokeWidth: 0,
        fill: [178, 196, 219],
      });

      this.addText(
        doc,
        {
          x: def.x + margin + 2 * ptToLayout,
          y: def.y + def.height - margin - height / 2,
          text: scaleInfo.label,
          size: 12,
          color: [238, 238, 238],
        },
        {
          baseline: "middle",
        }
      );
    }

    doc.setGeoArea(pdfExtents, mapExtents);
  }

  /* Draw a shape on the map.
   *
   * Supported shapes: rect, ellipse
   */
  addDrawing(doc, def) {
    // determine the style string
    let style = "S";
    if (def.filled) {
      style = "DF";
      const fill = def.fill ? def.fill : [255, 255, 255];
      doc.setFillColor(fill[0], fill[1], fill[2]);
    }

    // set the stroke width
    const strokeWidth =
      def.strokeWidth !== undefined ? def.strokeWidth : this.toPoints(1, "px");
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
      doc.rect(def.x, def.y, def.width, def.height, style);
    } else if (def.type === "ellipse") {
      doc.ellipse(def.x, def.y, def.rx, def.ry, style);
    }
  }

  /**
   * Convert units to PDF units
   *
   */
  toPoints(n, unit) {
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
          this.addDrawing(doc, element);
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

  /* The Map Image size changes based on the layout used
   * and the resolution selected by the user.
   *
   * @return An object with "width" and "height" properties.
   */
  getMapSize() {
    const layout = this.state.layouts[this.state.layout];
    const resolution = this.state.resolution;
    // iterate through the layout elements looking
    //  for the map.
    let mapElement = null;
    for (const element of layout.elements) {
      if (element.type === "map") {
        mapElement = element;
        break;
      }
    }

    // caculate the width and height and kick it back.
    return {
      width: this.toPoints(mapElement.width, layout.units) * resolution,
      height: this.toPoints(mapElement.height, layout.units) * resolution,
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

  /** Render a select drop down that allows the user
   *  to up the DPI.
   */
  renderResolutionSelect(t) {
    return (
      <select
        onChange={(evt) => {
          this.setState({
            resolution: evt.target.value,
          });
        }}
        value={this.state.resolution}
      >
        <option value="1">{t("resolution-normal")}</option>
        <option value="1.5">{t("resolution-higher")}</option>
        <option value="2">{t("resolution-highest")}</option>
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
          Some of the map layers cannot be printed. The map image in the
          resulting PDF may differ from what is seen in the map viewer.
        </div>
      );
    }

    const mapSize = this.getMapSize();
    return (
      <div>
        {printWarning}

        <Translation>
          {(t) => (
            <div>
              <p>
                <label>{`${t("map-title")}:`}</label>
                <input
                  placeholder={t("map-title")}
                  value={this.state.mapTitle}
                  onChange={(evt) => {
                    this.setState({ mapTitle: evt.target.value });
                  }}
                />
              </p>
              <p>
                <label>{`${t("page-layout")}:`}</label>
                {this.renderLayoutSelect(t)}
              </p>
              <p>
                <label>{`${t("resolution")}:`}</label>
                {this.renderResolutionSelect(t)}
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
            store={this.props.store}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  mapSources: state.mapSources,
  open: state.ui.modal === "print",
  mapView: state.map,
  printData: state.print.printData,
  catalog: state.catalog,
});

const mapDispatchToProps = {
  hideModal,
};

export default connect(mapStateToProps, mapDispatchToProps)(PrintModal);
