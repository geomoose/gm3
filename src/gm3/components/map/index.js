/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-present Dan "Ducky" Little
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

/** The big bopper of all the GeoMoose Components, the Catalog.
 *
 *  This is the most exercised component of GeoMoose and serves
 *  as the 'dispatch' center to the map, presenting the layers
 *  of the mapbook in a nice tree format.
 */

import React from "react";
import { connect } from "react-redux";
import ReactResizeDetector from "react-resize-detector";
import { withTranslation } from "react-i18next";

import uuid from "uuid";

import * as mapSourceActions from "../../actions/mapSource";
import * as mapActions from "../../actions/map";
import { removeFeature, setEditFeature } from "../../actions/edit";
import {
  setCursor,
  updateSketchGeometry,
  resizeMap,
} from "../../actions/cursor";

import { getHighlightResults } from "../../selectors/query";

import * as util from "../../util";
import * as jsts from "../../jsts";

import GeoJSONFormat from "ol/format/GeoJSON";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import * as proj from "ol/proj";

import olScaleLine from "ol/control/ScaleLine";

import olView from "ol/View";
import olMap from "ol/Map";

import olCollection from "ol/Collection";
import olSelectInteraction from "ol/interaction/Select";
import olDrawInteraction, { createBox } from "ol/interaction/Draw";
import olModifyInteraction from "ol/interaction/Modify";
import * as olEventConditions from "ol/events/condition";

import olRotateControl from "ol/control/Rotate";

/* Import the various layer types */
import * as wmsLayer from "./layers/wms";
import * as xyzLayer from "./layers/xyz";
import * as agsLayer from "./layers/ags";
import * as vectorLayer from "./layers/vector";
import * as bingLayer from "./layers/bing";
import * as usngLayer from "./layers/usng";
import { createLayer as createBlankLayer } from "./layers/blank";

import { wfsGetFeatures } from "./layers/wfs";
import { EDIT_LAYER_NAME } from "../../defaults";

import EditorModal from "../editor";
import RemoveModal from "../editor/remove-modal";
import AttributionDisplay from "./attribution-display";
import JumpToZoom from "./jump-to-zoom";

import ContextControls from "./context-controls";

function getControls(mapConfig) {
  const controls = [];
  if (mapConfig.allowRotate !== false) {
    controls.push(new olRotateControl());
  }
  const scaleLineConf = Object.assign(
    { enabled: false, units: "metric" },
    mapConfig.scaleLine
  );
  if (scaleLineConf.enabled !== false) {
    controls.push(new olScaleLine({ units: scaleLineConf.units }));
  }
  return controls;
}

const GEOJSON_FORMAT = new GeoJSONFormat();

const getPixelTolerance = (querySource, defaultPx = 10) => {
  // the default pixel tolerance is 10 pixels.
  let pxTolerance = defaultPx;
  try {
    if (querySource.config["pixel-tolerance"]) {
      pxTolerance = parseFloat(querySource.config["pixel-tolerance"]);
    }
  } catch (err) {
    // swallow the error
  }
  return pxTolerance;
};

const applyPixelTolerance = (
  queryFeature,
  querySource,
  resolution,
  defaultPxTolerance
) => {
  const pxTolerance = getPixelTolerance(querySource, defaultPxTolerance);
  if (pxTolerance > 0 && queryFeature.geometry.type === "Point") {
    // buffer point is in pixels,
    //  this converts pixels to ground units
    const width = pxTolerance * resolution;
    return util.getSquareBuffer(queryFeature.geometry.coordinates, width);
  }
  return queryFeature;
};

class Map extends React.Component {
  constructor() {
    super();

    // hash of mapsources
    this.olLayers = {};

    // the current 'active' interaction
    this.currentInteraction = null;

    // a hash of interval timers for layers that
    //  are set to auto-refresh
    this.intervals = {};

    this.updateMapSize = this.updateMapSize.bind(this);

    // this is used when a feature isn't finished yet.
    this.sketchFeature = null;
  }

  /** Update a source's important bits.
   *
   *  @param sourceName The name of the mapsource to update.
   *
   */
  updateSource(sourceName) {
    const mapSource = this.props.mapSources[sourceName];
    const olLayer = this.olLayers[sourceName];
    switch (mapSource.type) {
      case "wms":
        wmsLayer.updateLayer(this.map, olLayer, mapSource);
        break;
      case "xyz":
        xyzLayer.updateLayer(this.map, olLayer, mapSource);
        break;
      case "ags":
        agsLayer.updateLayer(this.map, olLayer, mapSource);
        break;
      case "vector":
      case "wfs":
      case "ags-vector":
      case "geojson":
        vectorLayer.updateLayer(
          this.map,
          olLayer,
          mapSource,
          this.props.mapView.interactionType
        );
        break;
      case "bing":
        bingLayer.updateLayer(this.map, olLayer, mapSource);
        break;
      case "usng":
        usngLayer.updateLayer(this.map, olLayer, mapSource);
        break;
      case "blank":
        // this is a non-op, blank will be blank for all time.
        break;
      default:
        console.info("Unhandled map-source type: " + mapSource.type);
    }
  }

  /** Create an OL Layers based on a GM MapSource definition
   *
   *  @param mapSource
   *
   *  @returns OpenLayers Layer with its source set.
   */
  createLayer(mapSource) {
    switch (mapSource.type) {
      case "wms":
        return wmsLayer.createLayer(mapSource);
      case "xyz":
        return xyzLayer.createLayer(mapSource);
      case "ags":
        return agsLayer.createLayer(mapSource);
      case "vector":
      case "wfs":
      case "ags-vector":
      case "geojson":
        return vectorLayer.createLayer(mapSource);
      case "bing":
        return bingLayer.createLayer(mapSource);
      case "usng":
        return usngLayer.createLayer(mapSource);
      case "blank":
        return createBlankLayer();
      default:
        throw new Error(
          "Unhandled creation of map-source type: " + mapSource.type
        );
    }
  }

  /** Remove an interval to prevent a layer from being repeatedly
   *  refreshed.
   *
   *  @param {String} msName The name of the map-source with refresh enabled.
   *
   */
  removeRefreshInterval(msName) {
    if (this.intervals[msName]) {
      clearInterval(this.intervals[msName]);
      delete this.intervals[msName];
    }
  }

  /** Forces a layer to refresh.
   *
   */
  refreshLayer(mapSource) {
    switch (mapSource.type) {
      case "wms":
        const wmsSrc = this.olLayers[mapSource.name].getSource();
        const params = wmsSrc.getParams();
        // ".ck" = "cache killer"
        params[".ck"] = uuid.v4();
        wmsSrc.updateParams(params);
        break;
      default:
      // do nothing
    }
  }

  /** Create an interval that will refresh the layer's contents.
   *
   */
  createRefreshInterval(mapSource) {
    // prevent the creation of a pile of intervals
    if (!this.intervals.hasOwnProperty(mapSource.name)) {
      // refresh is stored in seconds, multiplying by 1000
      //  converts ito the milliseconds expected by setInterval.
      this.intervals[mapSource.name] = setInterval(() => {
        this.refreshLayer(mapSource);
      }, mapSource.refresh * 1000);
    }
  }

  /* Render the query as a layer.
   *
   */
  renderQueryLayer() {
    if (this.props.mapSources.results) {
      const src = this.olLayers.results.getSource();
      src.clear(true);
      src.addFeatures(
        GEOJSON_FORMAT.readFeatures({
          type: "FeatureCollection",
          features: this.props.highlightResults,
        })
      );
    } else if (
      this.props.highlightResults &&
      this.props.highlightResults.length > 0
    ) {
      console.error(
        'No "results" layer has been defined, cannot do smart query rendering.'
      );
    }
  }

  /** Refresh the map-sources in the map
   *
   */
  refreshMapSources() {
    // get the list of current active map-sources
    const printOnly = this.props.printOnly === true;
    const activeMapSources = mapSourceActions.getActiveMapSources(
      this.props.mapSources,
      printOnly
    );

    // annoying O(n^2) iteration to see if the mapsource needs
    //  to be turned off.
    for (const mapSourceName in this.olLayers) {
      // if the mapSourceName is not active, turn the entire source off.
      if (activeMapSources.indexOf(mapSourceName) < 0) {
        this.olLayers[mapSourceName].setVisible(false);
        this.removeRefreshInterval(mapSourceName);
      }
    }

    // for each one of the active mapsources,
    //  determine if the olSource already exists, if not
    //   create it, if it does, turn it back on.
    for (const mapSourceName of activeMapSources) {
      const mapSource = this.props.mapSources[mapSourceName];
      if (!this.olLayers[mapSourceName]) {
        // create the OL layer
        this.olLayers[mapSourceName] = this.createLayer(mapSource);
        this.map.addLayer(this.olLayers[mapSourceName]);
      } else {
        this.updateSource(mapSourceName);
        this.olLayers[mapSourceName].setVisible(true);
      }
      this.olLayers[mapSourceName].setZIndex(mapSource.zIndex);
      this.olLayers[mapSourceName].setOpacity(mapSource.opacity);

      // if there is a refresh interval set then
      //  create an interval which refreshes the
      //  layer.
      if (mapSource.refresh !== null) {
        // here's hoping this is an integer,
        //  thanks Javascript!
        this.createRefreshInterval(mapSource);
      } else if (mapSource.refresh === null && this.intervals[mapSourceName]) {
        this.removeRefreshInterval(mapSourceName);
      }
    }

    this.renderQueryLayer();
  }

  /** Add features to the selection layer.
   *
   *  @param inFeatures Current list of features
   *  @param inBuffer   A buffer distance to apply.
   *
   */
  addSelectionFeatures(inFeatures, inBuffer) {
    const features = inFeatures.map((feature) =>
      GEOJSON_FORMAT.writeFeatureObject(feature)
    );
    const buffer = inBuffer !== 0 && !isNaN(inBuffer) ? inBuffer : 0;

    let bufferedFeature = features;

    if (buffer !== 0) {
      // buffer + union the features
      const wgs84Features = util.projectFeatures(
        features,
        "EPSG:3857",
        "EPSG:4326"
      );

      // buffer those features.
      bufferedFeature = [
        jsts.union(
          util.projectFeatures(
            wgs84Features.map((feature) => {
              const buffered = jsts.bufferFeature(feature, buffer);
              buffered.properties = {
                buffer: true,
              };
              return buffered;
            }),
            "EPSG:4326",
            "EPSG:3857"
          )
        ),
      ];
    }

    // the selection feature(s) are the original, as-drawn feature.
    this.props.setSelectionFeatures(features);

    // the feature(s) stored in the selection are what will
    //  be used for querying.
    this.props.setFeatures("selection", bufferedFeature);
  }

  /** Create a selection layer for temporary selection features.
   *
   */
  configureSelectionLayer() {
    const srcSelection = new VectorSource();

    this.selectionLayer = new VectorLayer({
      source: srcSelection,
    });

    // Fake a GeoMoose style source + layer definition
    //  to bootstrap the style
    vectorLayer.applyStyle(this.selectionLayer, {
      layers: [{ on: true, style: this.props.selectionStyle }],
    });
  }

  /** This is called after the first render.
   *  As state changes will not actually change the DOM according to
   *  React, this will establish the map.
   */
  componentDidMount() {
    // create the selection layer.
    this.configureSelectionLayer();

    const viewParams = {};

    if (this.props.center) {
      viewParams.center = this.props.center;

      // check for a z-settings.
      if (this.props.zoom) {
        viewParams.zoom = this.props.zoom;
      } else if (this.props.resolution) {
        viewParams.resolution = this.props.resolution;
      }
    } else {
      viewParams.center = this.props.mapView.center;
      if (this.props.mapView.zoom) {
        viewParams.zoom = this.props.mapView.zoom;
      } else {
        viewParams.resolution = this.props.mapView.resolution;
      }
    }

    if (this.props.config.view) {
      const mixinKeys = ["extent", "center", "zoom", "maxZoom", "minZoom"];
      mixinKeys.forEach((key) => {
        if (this.props.config.view[key]) {
          viewParams[key] = this.props.config.view[key];
        }
      });
    }

    // initialize the map.
    this.map = new olMap({
      target: this.mapDiv,
      layers: [this.selectionLayer],
      logo: false,
      view: new olView(viewParams),
      controls: getControls(this.props.config),
    });

    if (this.props.mapView.extent) {
      this.zoomToExtent(this.props.mapView.extent);
    }

    // when the map moves, dispatch an action
    this.map.on("moveend", () => {
      // get the view of the map
      const view = this.map.getView();
      // create a "mapAction" and dispatch it.
      this.props.store.dispatch(
        mapActions.setView({
          center: view.getCenter(),
          resolution: view.getResolution(),
          zoom: view.getZoom(),
        })
      );
    });

    // and when the cursor moves, dispatch an action
    //  there as well.
    this.map.on("pointermove", (event) => {
      this.props.store.dispatch(setCursor(event.coordinate));
      if (this.sketchFeature) {
        // convert the sketch feature's geometry to JSON and kick it out
        // to the store.
        const jsonGeom = util.geomToJson(this.sketchFeature.getGeometry());
        this.props.store.dispatch(updateSketchGeometry(jsonGeom));
      }
    });

    // call back for when the map has finished rendering.
    if (this.props.mapRenderedCallback) {
      this.map.on("postrender", () => this.props.mapRenderedCallback(this.map));
    }

    // once the map is created, kick off the initial startup.
    this.refreshMapSources();

    // note the size of the map
    this.props.onMapResize({
      width: this.mapDiv.clientWidth,
      height: this.mapDiv.clientHeight,
    });
  }

  /** Switch the drawing tool.
   *
   *  @param type The type of drawing tool (Point,LineString,Polygon)
   *  @param path The layer on which to mark.  null = "selection", the ephemeral layer.
   *  @param oneAtATime {Boolean} When true, only one feature will be allowed to be drawn
   *                              at a time.
   *
   */
  activateDrawTool(type, path, oneAtATime) {
    const isSelection = path === null;
    const mapSourceName = util.getMapSourceName(path);
    const mapSource = this.props.mapSources[mapSourceName];

    // normalize the input.
    if (typeof type === "undefined") {
      type = null;
    }

    // when path is null, use the selection layer,
    //  else use the specified source.
    let source = this.selectionLayer.getSource();
    if (!isSelection) {
      source = this.olLayers[mapSourceName].getSource();
    }

    // stop the 'last' drawing tool.
    this.stopDrawing();

    // make sure the type is set.
    this.currentInteraction = type;

    // "null" interaction mean no more drawing.
    if (type !== null) {
      // switch to the new drawing tool.
      if (type === "Select") {
        this.drawTool = new olSelectInteraction({
          // toggleCondition: olEventConditions.never,
          toggleCondition: olEventConditions.shiftKeyOnly,
          layers: [this.olLayers[mapSourceName]],
        });

        this.drawTool.on("select", (evt) => {
          const selectedFeatures = evt.target.getFeatures();
          this.addSelectionFeatures(
            selectedFeatures.getArray(),
            this.props.selectionBuffer
          );
        });
      } else if (type === "Modify" || type === "Edit" || type === "Remove") {
        let layer = null;
        if (path !== null) {
          try {
            layer = mapSourceActions.getLayerFromPath(
              this.props.mapSources,
              path
            );
          } catch (err) {
            // swallow the error if the layer can't be found.
          }
        }

        const modifyNext = (editFeatures) => {
          // tell other tools where this feature originated.
          this.props.setEditPath(path);

          // set the features of the editing layer
          //  to the selected feature.
          this.props.setFeatures(EDIT_LAYER_NAME, editFeatures, true);

          // only show the follow up steps if a feature is selected
          if (editFeatures && editFeatures.length > 0) {
            if (type === "Remove") {
              this.props.removeFeature(path, editFeatures[0]);
            } else if (type === "Edit") {
              this.props.onEditProperties(editFeatures[0]);
            } else if (type === "Modify") {
              // unset the edit-selection tool
              this.props.changeTool(
                "_Modify",
                `${EDIT_LAYER_NAME}/${EDIT_LAYER_NAME}`
              );
            }
          }
        };

        if (
          isSelection ||
          ["wfs", "vector", "geojson"].indexOf(mapSource.type) >= 0
        ) {
          const layers = isSelection
            ? [this.selectionLayer]
            : [this.olLayers[mapSourceName]];

          this.drawTool = new olSelectInteraction({
            layers,
            style: null,
          });

          this.drawTool.on("select", (evt) => {
            modifyNext([GEOJSON_FORMAT.writeFeatureObject(evt.selected[0])]);
          });
        } else if (layer && layer.queryAs.length > 0) {
          const editSrc = this.olLayers[EDIT_LAYER_NAME].getSource();

          this.drawTool = new olDrawInteraction({
            type: "Point",
            source: editSrc,
          });

          this.drawTool.on("drawend", (evt) => {
            const querySourceName = util.getMapSourceName(layer.queryAs[0]);
            const querySource = this.props.mapSources[querySourceName];
            let queryFeature = util.featureToJson(evt.feature);

            const mapProjection = this.map.getView().getProjection();
            queryFeature = applyPixelTolerance(
              queryFeature,
              querySource,
              this.props.mapView.resolution,
              10
            );

            editSrc.clear();

            wfsGetFeatures(
              {
                selection: [queryFeature],
                fields: [],
              },
              querySource,
              mapProjection
            ).then((features) => {
              modifyNext(features);
            });
          });
        }
      } else if (type === "_Modify") {
        const features = source.getFeatures();
        this.drawTool = new olModifyInteraction({
          features: new olCollection(features),
        });
      } else if (type !== "") {
        const editSrc = this.olLayers[EDIT_LAYER_NAME].getSource();
        const drawOptions = {
          type,
        };

        // Draw by box requires some special settings.
        if (type === "Box") {
          drawOptions.type = "Circle";
          drawOptions.geometryFunction = createBox();
        }
        this.drawTool = new olDrawInteraction(drawOptions);

        if (oneAtATime === true && type !== "MultiPoint") {
          this.drawTool.on("drawstart", (evt) => {
            // clear out the other features on the source.
            source.clear();
            this.sketchFeature = evt.feature;
          });
        } else {
          this.drawTool.on("drawstart", (evt) => {
            this.sketchFeature = evt.feature;
          });
        }

        if (!isSelection) {
          this.drawTool.on("drawend", (evt) => {
            const newFeature = GEOJSON_FORMAT.writeFeatureObject(evt.feature);
            editSrc.clear();

            const layer = mapSourceActions.getLayerFromPath(
              this.props.mapSources,
              path
            );

            let querySource = mapSource;
            if (layer.queryAs && layer.queryAs.length > 0) {
              const querySourceName = util.getMapSourceName(layer.queryAs[0]);
              querySource = this.props.mapSources[querySourceName];
            }

            if (
              util.parseBoolean(
                querySource.config["edit-attributes-on-add"],
                true
              )
            ) {
              this.props.setEditPath(path);
              this.props.onEditProperties(newFeature, true);
            } else {
              this.props.saveFeature(path, newFeature);
            }

            // drawing is finished, no longer sketching.
            this.sketchFeature = null;
            this.props.store.dispatch(updateSketchGeometry(null));
          });
        } else {
          this.drawTool.on("drawend", (evt) => {
            // drawing is finished, no longer sketching.
            this.sketchFeature = null;
            this.props.store.dispatch(updateSketchGeometry(null));

            let nextFeatures = [evt.feature];
            if (type === "MultiPoint") {
              nextFeatures = this.selectionLayer.getSource().getFeatures();
              nextFeatures.push(evt.feature);
            }

            this.addSelectionFeatures(nextFeatures, this.props.selectionBuffer);
          });
        }
      }

      if (this.drawTool) {
        this.map.addInteraction(this.drawTool);
      }
    }
  }

  /** Clear out any current draw tools.
   *
   */
  stopDrawing() {
    // only remove the draw tool if it exists.
    if (this.drawTool) {
      // off the map
      this.map.removeInteraction(this.drawTool);
      // null out for logic.
      this.drawTool = null;

      // and the current interaction
      this.currentInteraction = null;
    }
  }

  /** This is a hack for OpenLayers. It makes sure the map is
   *   properly sized under various conditions.
   *
   * @returns Boolean. True when the map sucessfully sized, false otherwise.
   */
  updateMapSize(width, height) {
    if (this.map && this.mapDiv) {
      this.map.updateSize();

      // this is a hint for other components to calculate
      //  things based on the map size.
      // this.props.onMapResize({width, height});

      const canvas = this.mapDiv.getElementsByTagName("canvas");
      if (canvas && canvas[0] && canvas[0].style.display !== "none") {
        return true;
      }
    }
    return false;
  }

  zoomToExtent(extent) {
    let bbox = extent.bbox;
    const bboxCode = extent.projection;
    if (bboxCode) {
      const mapProj = this.map.getView().getProjection();
      bbox = proj.transformExtent(bbox, proj.get(bboxCode), mapProj);
    }
    // move the map to the new extent.
    this.map
      .getView()
      .fit(bbox, { size: this.map.getSize(), padding: [15, 15, 15, 15] });
  }

  /** Intercept extent changes during a part of the render
   *  cycle where the state can get modified.
   */
  componentDidUpdate(prevProps) {
    // extent takes precendent over the regular map-view,
    if (this.props.mapView.extent) {
      this.zoomToExtent(this.props.mapView.extent);
      // check to see if the view has been altered.
    } else if (this.props.mapView) {
      const mapView = this.map.getView();
      const view = this.props.mapView;

      const center = mapView.getCenter();
      const resolution = mapView.getResolution();

      if (
        center[0] !== view.center[0] ||
        center[1] !== view.center[1] ||
        resolution !== view.resolution
      ) {
        this.map.getView().setCenter(view.center);
        this.map.getView().setResolution(view.resolution);
      }

      // ensure zoom is defined.
      if (view.zoom && mapView.getZoom() !== view.zoom) {
        this.map.getView().setZoom(view.zoom);
      }
    }

    // handle out of loop buffer distance changes
    if (this.selectionLayer) {
      if (this.props.selectionBuffer !== prevProps.selectionBuffer) {
        const features = this.props.selectionFeatures.map((feature) =>
          GEOJSON_FORMAT.readFeature(feature)
        );
        if (features.length > 0) {
          this.addSelectionFeatures(features, this.props.selectionBuffer);
        }
      }
      if (this.props.selectionFeatures !== prevProps.selectionFeatures) {
        const src = this.selectionLayer.getSource();
        src.clear();
        this.props.selectionFeatures.forEach((feature) => {
          src.addFeature(GEOJSON_FORMAT.readFeature(feature));
        });
      }
    }

    // ensure the map is defined and ready.
    if (this.map) {
      // refresh all the map sources, as approriate.
      this.refreshMapSources();
      const interactionType = this.props.mapView.interactionType;

      if (
        interactionType !== prevProps.mapView.interactionType ||
        this.props.mapView.activeSource !== prevProps.mapView.activeSource ||
        interactionType !== this.currentInteraction
      ) {
        // "null" refers to the selection layer, "true" means only one feature
        //   at a time.
        const isSelection = this.props.mapView.activeSource === null;
        this.activateDrawTool(
          this.props.mapView.interactionType,
          this.props.mapView.activeSource,
          isSelection
        );

        // clear out the previous features
        //  if changing the draw tool type.
        /*
                const drawTypes = ['Polygon', 'LineString', 'Box', 'Point', 'MultiPoint'];
                if (drawTypes.indexOf(this.props.mapView.interactionType) >= 0) {
                    const typeDict = {
                        'Box': 'Polygon',
                        'MultiPoint': 'Point',
                    };
                    const keepers = this.props.selectionFeatures
                        .filter(feature => (
                            feature.geometry.type === interactionType ||
                            (
                                typeDict[interactionType] !== undefined &&
                                feature.geometry.type === typeDict[interactionType]
                            )
                        ));
                    this.props.setSelectionFeatures(keepers);
                    this.props.setFeatures('selection', keepers);
                }
                */
      }

      // note the size of the map
      this.props.onMapResize({
        width: this.mapDiv.clientWidth,
        height: this.mapDiv.clientHeight,
      });
    }
  }

  render() {
    // ensure the map is defined and ready.
    if (this.map) {
      // update the map size when data changes
      setTimeout(this.updateMapSize, 250);
    }

    // IE has some DOM sizing/display issues on startup
    //  when we're using react. This ensures the map is
    //  drawn correctly on startup.
    const updateMapSize = this.updateMapSize;
    if (!updateMapSize()) {
      const startupInterval = setInterval(function () {
        if (updateMapSize()) {
          clearInterval(startupInterval);
        }
      }, 250);
    }

    const config = this.props.config || {};

    const enableZoomJump = config.enableZoomJump === true;

    return (
      <div
        className="map"
        ref={(self) => {
          this.mapDiv = self;
        }}
      >
        <ReactResizeDetector
          handleWidth
          handleHeight
          onResize={this.updateMapSize}
        />
        <AttributionDisplay store={this.props.store} />

        <EditorModal store={this.props.store} />
        <RemoveModal store={this.props.store} />

        <div className="map-tools">
          {enableZoomJump && <JumpToZoom store={this.props.store} />}

          <ContextControls
            saveFeature={(path, feature) => {
              // this is the selection layer
              if (path === null) {
                // convert the feature back to OL
                const olFeature = GEOJSON_FORMAT.readFeature(feature);
                this.addSelectionFeatures(
                  [olFeature],
                  this.props.selectionBuffer
                );
              } else {
                this.props.saveFeature(path, feature);
              }
            }}
            editPath={this.props.mapView.editPath}
            editTools={this.props.mapView.editTools}
            olLayers={this.olLayers}
            setFeatures={this.props.setFeatures}
            changeTool={this.props.changeTool}
            interactionType={this.props.mapView.interactionType}
            activeSource={this.props.mapView.activeSource}
            setZoom={this.props.setZoom}
            zoom={this.props.mapView.zoom}
            showZoom={config.showZoom === true}
            setEditPath={this.props.setEditPath}
            setEditTools={this.props.setEditTools}
          />
        </div>
      </div>
    );
  }
}

Map.defaultProps = {
  services: {},
  onMapResize: () => {},
};

function mapState(state) {
  return {
    mapSources: state.mapSources,
    mapView: state.map,
    config: state.config.map || {},
    selectionStyle: state.config.selectionStyle || {},
    // resolve this to meters
    selectionBuffer: util.convertLength(
      state.map.selectionBuffer,
      state.map.selectionBufferUnits,
      "m"
    ),
    selectionFeatures: state.map.selectionFeatures,
    highlightResults: getHighlightResults(state),
  };
}

function mapDispatch(dispatch) {
  return {
    changeTool: (toolName, opt) => {
      dispatch(mapActions.changeTool(toolName, opt));
    },
    onEditProperties: (feature, isNew = false) => {
      dispatch(setEditFeature(feature, isNew));
    },
    setSelectionFeatures: (features) => {
      dispatch(mapActions.clearSelectionFeatures());
      features.forEach((feature) => {
        dispatch(mapActions.addSelectionFeature(feature));
      });
    },
    setFeatures: (mapSourceName, features, copy = false) => {
      dispatch(mapSourceActions.clearFeatures(mapSourceName));
      dispatch(mapSourceActions.addFeatures(mapSourceName, features, copy));
    },
    setEditPath: (path) => dispatch(mapActions.setEditPath(path)),
    setEditTools: (tools) => dispatch(mapActions.setEditTools(tools)),
    saveFeature: (path, feature) => {
      dispatch(mapSourceActions.saveFeature(path, feature));
    },
    setZoom: (z) => dispatch(mapActions.setView({ zoom: z })),
    removeFeature: (path, feature) => {
      dispatch(removeFeature(path, feature));
    },
    onMapResize: (size) => dispatch(resizeMap(size)),
  };
}

export default connect(mapState, mapDispatch)(withTranslation()(Map));

export function getLegend(mapSource, mapView, layerName) {
  // see if the layer has a fixed legend.
  for (const layer of mapSource.layers) {
    if (
      layer.name === layerName &&
      layer.legend !== undefined &&
      layer.legend !== null
    ) {
      // translate from the store represenation to
      // what's used to render the legend.
      if (layer.legend.type === "html") {
        return {
          type: "html",
          html: layer.legend.contents,
        };
      } else if (layer.legend.type === "img") {
        return {
          type: "img",
          images: [layer.legend.contents],
        };
      } else if (layer.legend.type === "nolegend") {
        return {
          type: "nolegend",
        };
      }
    }
  }

  // if the mapSource type supports legends, fetch them,
  // otherwise return 'nolegend'.
  switch (mapSource.type) {
    case "wms":
      return wmsLayer.getLegend(mapSource, mapView, layerName);
    default:
      return {
        type: "nolegend",
      };
  }
}
