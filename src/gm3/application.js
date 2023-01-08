/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Dan "Ducky" Little
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

/** In GeoMoose, the 'Applicaiton' class is the main 'component'
 *
 *  It provides a ES5 API to normalize all the underlaying libraries.
 *
 */

import i18next from "i18next";

import * as Proj from "ol/proj";

import * as ExperimentalApi from "./experimental";
import * as mapSourceActions from "./actions/mapSource";
import * as mapActions from "./actions/map";
import * as uiActions from "./actions/ui";

import {
  startService,
  createQuery,
  runQuery,
  setHotFilter,
  removeQueryResults,
} from "./actions/query";

import { parseCatalog } from "./actions/catalog";
import { parseToolbar } from "./actions/toolbar";
import { setConfig } from "./actions/config";

import Modal from "./components/modal";

import React from "react";
import { createRoot } from "react-dom/client";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";

import {
  getLayerFromPath,
  getVisibleLayers,
  getQueryableLayers,
  getActiveMapSources,
} from "./actions/mapSource";

import Mark from "markup-js";

import {
  addProjDef,
  getMapSourceName,
  getLayerName,
  FORMAT_OPTIONS,
  parseQuery,
} from "./util";
import { normalizeFieldValues, normalizeSelection } from "./query/util";

import i18nConfigure from "./i18n";
import {
  EDIT_LAYER_NAME,
  EDIT_STYLE,
  HIGHLIGHT_STYLE,
  HIGHLIGHT_HOT_STYLE,
  SELECTION_STYLE,
} from "./defaults";
import { createStore } from "./store";

function hydrateConfig(userConfig = {}) {
  const config = userConfig;
  // the depth of resultsStyle makes this slightly trickier to
  //  set the defaults, so it's handled individually.
  if (userConfig.resultsStyle) {
    config.resultsStyle = {
      highlight: Object.assign(
        {},
        HIGHLIGHT_STYLE,
        userConfig.resultsStyle.highlight
      ),
      hot: Object.assign({}, HIGHLIGHT_HOT_STYLE, userConfig.resultsStyle.hot),
    };
  } else {
    config.resultsStyle = {
      highlight: HIGHLIGHT_STYLE,
      hot: HIGHLIGHT_HOT_STYLE,
    };
  }

  config.selectionStyle = Object.assign(
    {},
    SELECTION_STYLE,
    userConfig.selectionStyle
  );

  return config;
}

function getServiceRunOptions(serviceDef) {
  const runOpts = {};
  const boolKeys = ["zoomToResults", "gridMinimized"];
  boolKeys.forEach((key) => {
    runOpts[key] = serviceDef[key] === true;
  });
  return runOpts;
}

class Application {
  constructor(userConfig = {}) {
    const config = hydrateConfig(userConfig);

    this.elements = [];

    this.services = {};

    this.actions = {};

    this.config = config;

    i18nConfigure(userConfig.lang || {});

    register(proj4);

    this.store = createStore();
    this.store.dispatch(setConfig(config));

    this.state = {};

    this.store.subscribe(() => {
      this.shouldUiUpdate();
    });

    this.showWarnings = config.showWarnings === true;

    // import the experimental API.
    this.experimental = {};
    for (const fnName in ExperimentalApi) {
      this.experimental[fnName] = ExperimentalApi[fnName].bind(this);
    }
  }

  registerService(serviceName, serviceClass, options = {}) {
    // "serviceClass" should be a class that can be created,
    //  the only parameter to the constructor should be the application,
    //  which it uses to tie back to the 'react' environment.
    const service = new serviceClass(this, options);
    // set the service name to whatever it was registered as.
    service.name = serviceName;
    // see if there is an alais for the service.
    service.alias = options.alias || "";
    // check for results config
    service.resultsConfig = {
      ...service.resultsConfig,
      ...options.results,
    };
    // add it to the services object
    this.services[serviceName] = service;
  }

  /** Actions are classes with a "run" method which the application
   *  will run when they are a clicked.
   */
  registerAction(actionName, actionClass, options) {
    if (typeof options != "object") {
      options = {};
    }
    this.actions[actionName] = new actionClass(this, options);
  }

  /** Configure the default results layer.
   *
   *  This layer needs to exist so the map will properly render
   *  query reuslts.
   *
   */
  configureResultsLayer(resultsStyle = {}) {
    // add a blank base layer as "blank/blank"
    this.store.dispatch(
      mapSourceActions.add({
        name: "blank",
        urls: [],
        type: "blank",
      })
    );
    this.store.dispatch(
      mapSourceActions.addLayer("blank", {
        name: "blank",
        on: false,
        label: "No basemap",
      })
    );

    // add a layer that listens for changes
    //  to the query results.  This hs
    this.store.dispatch(
      mapSourceActions.add({
        name: "results",
        urls: [],
        type: "vector",
        label: "Results",
        opacity: 1.0,
        queryable: false,
        refresh: null,
        options: {
          "always-on": true,
        },
        params: {},
        // stupid high z-index to ensure results are
        //  on top of everything else.
        zIndex: 200001,
      })
    );

    const resultsStyleAll = Object.assign(
      {},
      HIGHLIGHT_STYLE,
      resultsStyle.highlight
    );
    this.store.dispatch(
      mapSourceActions.addLayer("results", {
        name: "results",
        on: true,
        label: "Results",
        selectable: true,
        style: resultsStyleAll,
        // filter: null,
      })
    );

    // the "hot" layer shows the features as red on the map,
    //  namely useful for hover-over functionality.
    const hotStyle = Object.assign({}, HIGHLIGHT_HOT_STYLE, resultsStyle.hot);
    this.store.dispatch(
      mapSourceActions.addLayer("results", {
        name: "results-hot",
        on: true,
        style: hotStyle,
        filter: ["==", "displayClass", "hot"],
      })
    );
  }

  configureSelectionLayer(selectionStyle, editStyle) {
    // add a layer that listens for changes
    //  to the query results.  This hs
    this.store.dispatch(
      mapSourceActions.add({
        name: "selection",
        urls: [],
        type: "vector",
        label: "Selection",
        opacity: 1.0,
        queryable: false,
        refresh: null,
        layers: [],
        options: {
          "always-on": true,
        },
        params: {},
        // stupid high z-index to ensure results are
        //  on top of everything else.
        zIndex: 200002,
      })
    );

    const selectionStyleAll = Object.assign(
      {},
      SELECTION_STYLE,
      selectionStyle
    );
    this.store.dispatch(
      mapSourceActions.addLayer("selection", {
        name: "selection",
        on: true,
        style: selectionStyleAll,
        filter: null,
      })
    );

    // temproary layer for editing.
    this.store.dispatch(
      mapSourceActions.add({
        name: EDIT_LAYER_NAME,
        urls: [],
        type: "vector",
        opacity: 1.0,
        queryable: false,
        refresh: null,
        layers: [],
        options: {
          "always-on": true,
        },
        params: {},
        zIndex: 200003,
      })
    );

    this.store.dispatch(
      mapSourceActions.addLayer(EDIT_LAYER_NAME, {
        name: EDIT_LAYER_NAME,
        on: true,
        style: Object.assign({}, EDIT_STYLE, editStyle),
        filter: null,
      })
    );
  }

  populateMapbook(contents) {
    let mapbookXml = contents;
    if (typeof contents === "string") {
      mapbookXml = new DOMParser().parseFromString(contents, "text/xml");
    }

    this.configureSelectionLayer(
      this.config.selectionStyle,
      this.config.editStyle
    );
    this.configureResultsLayer(this.config.resultsStyle);

    // load the map-sources
    const sources = mapbookXml.getElementsByTagName("map-source");
    for (let i = 0, ii = sources.length; i < ii; i++) {
      const ms = sources[i];
      mapSourceActions
        .addFromXml(ms, this.config)
        .forEach((action) => this.store.dispatch(action));
    }

    parseCatalog(
      this.store,
      mapbookXml.getElementsByTagName("catalog")[0]
    ).forEach((action) => this.store.dispatch(action));

    parseToolbar(mapbookXml.getElementsByTagName("toolbar")[0]).forEach(
      (action) => this.store.dispatch(action)
    );

    // return the parsed version of the document.
    return mapbookXml;
  }

  loadMapbook(options = {}) {
    // allow the user to specify fetch options
    const fetchOpts = {
      ...options.fetchOpts,
    };

    let mapbookUrl = options.url;

    if (this.config.mapbooks) {
      // check for a mapbook in the hash
      const mapbookName = parseQuery().query.mapbook || "default";
      if (mapbookName && this.config.mapbooks[mapbookName]) {
        mapbookUrl = this.config.mapbooks[mapbookName];
      }
    }

    if (mapbookUrl) {
      return fetch(mapbookUrl, fetchOpts)
        .then((r) => r.text())
        .then((content) => {
          return this.populateMapbook(content);
        });
    } else if (options.content) {
      return new Promise((resolve, reject) => {
        resolve(this.populateMapbook(options.content));
      });
    } else {
      alert("No mapbook configured.");
    }
  }

  add(component, domId, inProps = {}) {
    const props = Object.assign(
      {
        store: this.store,
      },
      inProps
    );
    props.services = this.services;

    const e = React.createElement(component, props);
    const root = createRoot(document.getElementById(domId));
    root.render(e);
  }

  addPlugin(component, domId, inProps = {}) {
    const props = Object.assign(
      {
        store: this.store,
        React: React,
        ReactDOM: { createRoot },
      },
      inProps
    );
    props.services = this.services;

    const e = React.createElement(component, props);
    const root = createRoot(document.getElementById(domId));
    root.render(e);
  }

  /** Run a query against the listed map-sources.
   *
   *  @param service   The registered service handling the query.
   *  @param selection A GeoMoose selection description
   *  @param fields    Array of {name:, value:, operation: } of fields to query.
   *  @param layers    Array of layer paths to query against.
   *  @param templatesIn Template name or Array of template names that should be ready.
   *
   */
  dispatchQuery(service, selection, fields, layers, templatesIn = []) {
    const templatePromises = [];

    // convert the "templatesIn" to an array.
    let templates = templatesIn;
    if (typeof templatesIn === "string") {
      templates = [templatesIn];
    }

    // iterate through the layer and the templates.
    for (const layer of layers) {
      for (const template of templates) {
        // gang the promises together.
        templatePromises.push(this.getTemplate(layer, template));
      }
    }

    const serviceDef = this.services[service];
    const runOptions = getServiceRunOptions(serviceDef);

    // require all the promises complete,
    //  then dispatch the store.
    Promise.all(templatePromises).then(() => {
      this.store.dispatch(
        createQuery(service, selection, fields, layers, runOptions)
      );
      this.store.dispatch(runQuery());
    });
  }

  /** Get a template's contents on promise.
   *
   *  @param path     The layer path.
   *  @param template The name of the template.
   *
   * @returns A promise for when the contents of the template is resolved.
   */
  getTemplate(path, template) {
    const templatePromise = new Promise((resolve, reject) => {
      if (template.substring(0, 1) === "@") {
        const templateName = template.substring(1);
        const layer = getLayerFromPath(this.store.getState().mapSources, path);
        const layerTemplate = layer.templates[templateName];

        if (layerTemplate) {
          if (layerTemplate.type === "alias") {
            // TODO: Someone is likely to think it's funny to do multiple
            //       levels of aliasing, this should probably look through that
            //       possibility.
            resolve(layer.templates[layerTemplate.alias].contents);
          } else if (layerTemplate.type === "remote") {
            const mapSourceName = getMapSourceName(path);
            const layerName = getLayerName(path);

            // fetch the contents of the template
            fetch(layerTemplate.src)
              .then((r) => r.text())
              .then((content) => {
                // convert the "remote" template to a local one
                this.store.dispatch(
                  mapSourceActions.setLayerTemplate(
                    mapSourceName,
                    layerName,
                    templateName,
                    {
                      ...layerTemplate,
                      type: "local",
                      contents: content,
                    }
                  )
                );
                // resolve this promise with the content
                resolve(content);
              })
              // when there is an error fetching the template,
              // 404 or whatever, return a blank template.
              .catch(() => {
                resolve("");
              });
          } else {
            resolve(layer.templates[templateName].contents);
          }
        } else {
          // TODO: It may be wiser to allow services to specify
          //       how failure to find a template should be handled.
          //       - Identify will simply not render features.
          //       - Select could have a critical failure without
          //          an appropriate template.

          // commented this out because it was causing identify on layers
          //  without an identify template to fail the entire query.

          // console.info('Failed to find template.', path, templateName);
          // reject('Failed to find template. ' + path + '@' + templateName);

          // resolve this as an empty template.
          resolve("");
        }
      }
    });

    return templatePromise;
  }

  /** Render feeatures from a query using a specified template.
   *
   *  @param query The query.
   *  @param template "Template like", "@..." will refer to a layer predefined
   *                                   template but a raw template string can
   *                                   be passed in that will be used for all layers.
   *
   * @returns HTML String.
   */
  renderFeaturesWithTemplate(query, path, template) {
    let templateContents = template;
    let htmlContents = "";

    if (query.results[path]) {
      if (query.results[path].failed === true) {
        htmlContents = `
                    <div class="query-error">
                        <div class="error-header">Error</div>
                        <div class="error-contents">
                        ${query.results[path].failureMessage}
                        </div>
                    </div>
                `;
      } else if (template.substring(0, 1) === "@") {
        const templateName = template.substring(1);
        const layer = getLayerFromPath(this.store.getState().mapSources, path);
        const layerTemplate = layer.templates[templateName];

        if (layerTemplate) {
          if (layerTemplate.type === "alias") {
            // TODO: Someone is likely to think it's funny to do multiple
            //       levels of aliasing, this should probably look through that
            //       possibility.
            templateContents = layer.templates[layerTemplate.alias].contents;
          } else {
            templateContents = layer.templates[templateName].contents;
          }
        } else {
          templateContents = null;
          // only show warnings when the application is
          //  configured to do so.
          if (this.showWarnings) {
            console.info("Failed to find template.", path, templateName);
          }
        }

        // do not try to iterate through the features if
        //  the template does not exist.
        if (templateContents) {
          for (const feature of query.results[path]) {
            // TODO: Make this plugable, check by template "type"?!?
            htmlContents += Mark.up(templateContents, feature, FORMAT_OPTIONS);
          }
        } else if (layerTemplate && layerTemplate.type === "auto") {
          const features = query.results[path];
          for (let i = 0, ii = features.length; i < ii; i++) {
            const feature = features[i];

            htmlContents += '<div class="result">';
            htmlContents += '<div class="feature-class">';
            htmlContents += layer.label;
            htmlContents += "</div>";

            const properties = Object.keys(feature.properties || {}).filter(
              (key) => key !== "_uuid"
            );

            if (properties.length > 0) {
              for (let k = 0, kk = properties.length; k < kk; k++) {
                const key = properties[k];
                const value = feature.properties[key];
                htmlContents += Mark.up(
                  "<b>{{ key }}:</b> {{ value }} <br/>",
                  {
                    key,
                    value,
                  },
                  FORMAT_OPTIONS
                );
              }
            } else {
              // no properties
              htmlContents += "<i>" + i18next.t("empty-properties") + "</i>";
            }
            htmlContents += "</div>";
          }
        }
      } else if (template) {
        // assume the template is template contents.
        for (const feature of query.results[path]) {
          htmlContents += Mark.up(template, feature, FORMAT_OPTIONS);
        }
      }
    }

    return htmlContents;
  }

  /** Render a template from a layer.
   *
   *  WARNING! This does not check to ensure the template has been loaded.
   *  Templates are loaded as a part of the query cycle.  A remote template
   *  may not be fully hydrated if calling this function BEFORE the layer
   *  has been queried against.
   *
   */
  renderTemplate(path, template, params) {
    if (template.substring(0, 1) === "@") {
      const templateName = template.substring(1);
      const layer = getLayerFromPath(this.store.getState().mapSources, path);
      const layerTemplate = layer.templates[templateName];
      let templateContents = "";

      if (layerTemplate) {
        if (layerTemplate.type === "alias") {
          // TODO: Someone is likely to think it's funny to do multiple
          //       levels of aliasing, this should probably look through that
          //       possibility.
          templateContents = layer.templates[layerTemplate.alias].contents;
        } else {
          templateContents = layer.templates[templateName].contents;
        }
        return Mark.up(templateContents, params, FORMAT_OPTIONS);
      }
    }
    return "";
  }

  /** Map the active map-source function to the application.
   *
   *  @returns an array of active map-sources.
   */

  getActiveMapSources() {
    return getActiveMapSources(this.store.getState().mapSources);
  }

  /** Get a list of all visible paths.
   *
   *  @returns an array of layer paths.
   */
  getVisibleLayers() {
    return getVisibleLayers(this.store.getState().mapSources);
  }

  /** Return a list of queryable layers.
   *
   *  @returns an array of layer paths.
   */
  getQueryableLayers(filter) {
    return getQueryableLayers(this.store.getState().mapSources, filter);
  }

  /** zoom to an extent
   *
   * @param {Array} extent An array of [minx, miny, maxx, maxy]
   * @param {String} projCode A projection code if the bounding box is in
   *                          a projection other than the map.
   *
   */
  zoomToExtent(extent, projCode) {
    this.store.dispatch(mapActions.zoomToExtent(extent, projCode));
  }

  /** Move the map to a center point and a resolution.
   *
   */
  zoomTo(lon, lat, zoom) {
    // TODO: The destination projection should come
    //       from the map state.
    // convert the lon lat coordinates to map coordinates
    const xy = Proj.transform([lon, lat], "EPSG:4326", "EPSG:3857");
    // trigger a move.
    this.store.dispatch(
      mapActions.setView({
        center: xy,
        zoom,
      })
    );
  }

  /** Generic bridge to the application's store's dispatch function.
   *
   */
  dispatch(action) {
    this.store.dispatch(action);
  }

  /** Remove all the features from a vector layer.
   */
  clearFeatures(path) {
    const mapSourceName = getMapSourceName(path);
    this.store.dispatch(mapSourceActions.clearFeatures(mapSourceName));
  }

  /** Add features to a vector layer.
   */
  addFeatures(path, features) {
    const mapSourceName = getMapSourceName(path);
    this.store.dispatch(mapSourceActions.addFeatures(mapSourceName, features));
  }

  /** Removes features from a query.
   */
  removeQueryResults(queryId, filter, options = {}) {
    const execRemove = (choice) => {
      if (choice === "confirm") {
        // With the new query structure,
        //  this might be more dangerous than before but the 3.x
        //  behaviour is current being preserved.
        // TODO: Should this just apply as a filter in 4.x instead
        //       of removing the result from teh queryset?
        this.dispatch(removeQueryResults(filter));
      }
    };

    if (options.withConfirm) {
      this.confirm("remove-feature", "Remove feature?", execRemove);
    } else {
      execRemove("confirm");
    }
  }

  /** Remove features from a vector layer (with a filter)
   */
  removeFeatures(path, filter) {
    const mapSourceName = getMapSourceName(path);
    this.store.dispatch(mapSourceActions.removeFeatures(mapSourceName, filter));
  }

  /** Change the features on a vectory layer with a filter.
   */
  changeFeatures(path, filter, properties) {
    const mapSourceName = getMapSourceName(path);
    this.store.dispatch(
      mapSourceActions.changeFeatures(mapSourceName, filter, properties)
    );
  }

  /* Shorthand for manipulating result features.
   */
  changeResultFeatures(filter, properties) {
    this.changeFeatures("results/results", filter, properties);
  }

  /** Clears the UI hint.  Used by applications to indicate
   *  that the previous "hint" has been handled.
   */
  clearHint() {
    this.store.dispatch(uiActions.clearUiHint());
  }

  /** Check for UI updates and trigger a "uiUpdate" call.
   *
   */
  shouldUiUpdate() {
    const ui = this.store.getState().ui;
    if (ui.stateId !== this.state.stateId) {
      this.state.stateId = ui.stateId;
      this.runAction();
      this.uiUpdate(ui);
    }
  }

  /** Check to see if the state has an 'action'
   *  to be executed.  Run it and then clear the state.
   */
  runAction() {
    const ui = this.store.getState().ui;
    if (ui.action) {
      this.actions[ui.action].run();
      this.store.dispatch(uiActions.clearAction());
    }
  }

  /** Kick off an action by name.
   *
   */
  startAction(actionName) {
    this.store.dispatch(uiActions.runAction(actionName));
  }

  /** Kick off a service by name
   *
   */
  startService(serviceName, options) {
    const serviceDef = this.services[serviceName];
    const nextTool =
      options && options.changeTool
        ? options.changeTool
        : serviceDef.tools.default;

    this.store.dispatch(
      startService({
        serviceName,
        defaultTool: nextTool,
        defaultValues: options.defaultValues,
        withFeatures: options.withFeatures,
      })
    );

    // when autoGo is set to true, the service will
    //   start the query.
    if (options.autoGo) {
      const state = this.store.getState();
      const selectionFeatures = state.mapSources.selection
        ? state.mapSources.selection.features
        : [];
      const selection = normalizeSelection(selectionFeatures);
      const fields = normalizeFieldValues(serviceDef, options.defaultValues);
      serviceDef.query(selection, fields);
    }
  }

  /** Handle updating the UI, does nothing in vanilla form.
   */
  uiUpdate() {
    // pass
  }

  /* Show an alert type dialog
   */
  alert(signature, message, callback = null) {
    const options = [{ label: "Okay", value: "dismiss" }];
    this.showDialog(signature, "Alert", message, options, callback);
  }

  confirm(signature, message, callback = null) {
    const options = [
      { label: "Cancel", value: "dismiss" },
      { label: "Okay", value: "confirm" },
    ];
    this.showDialog(signature, "Confirm", message, options, callback);
  }

  showDialog(signature, title, message, options, callback = null) {
    // create a target div for the dialog.
    const body = document.getElementsByTagName("body")[0];
    const modalDiv = document.createElement("div");
    body.appendChild(modalDiv);

    // configure the new props.
    const props = {
      title: title,
      onClose: (value) => {
        if (typeof callback === "function") {
          callback(value);
        }
        body.removeChild(modalDiv);
      },
      options,
      message,
      open: true,
    };

    const e = React.createElement(Modal, props);
    const root = createRoot(modalDiv);
    root.render(e);
  }

  showModal(modalKey) {
    this.store.dispatch(uiActions.showModal(modalKey));
  }

  /* Set the view of the map
   *
   * @param view {Object} A view definition containing center and zoom or resolution
   *
   */
  setView(view) {
    this.store.dispatch(mapActions.setView(view));
  }

  /**
   * addProjection
   * - A function that can be called by the user to add a custom projection.
   * - Facade for adding a projection to the proj4 registry, which then allows its use
   *     when calling the proj4 or OpenLayers libraries.
   *
   * @param {Object} projDef - an object containing an ID and a definition for a projection
   * @param {string} projDef.ref - a string ID that will be used to refer to defined projection
   * @param {string} projDef.def - a string definition of the projection, in WKT/Proj format
   */
  addProjection(projDef) {
    addProjDef(proj4, projDef.ref, projDef.def);
  }

  /* Short hand for toggling the highlight of features.
   */
  highlightFeatures(filter, on) {
    this.dispatch(setHotFilter(filter));
  }

  /* Clear highlight features
   */
  clearHighlight() {
    this.dispatch(setHotFilter(false));
  }

  /**
   * Project a point to web mercator.
   */
  lonLatToMeters(lon, lat) {
    return Proj.transform([lon, lat], "EPSG:4326", "EPSG:3857");
  }

  /**
   * Project a bounding box to web mercator.
   */
  bboxToMeters(west, south, east, north) {
    const [minx, miny] = this.lonLatToMeters(west, south);
    const [maxx, maxy] = this.lonLatToMeters(east, north);
    return [minx, miny, maxx, maxy];
  }

  /**
   * Checks for a start-up service from the query-parameters
   */
  startServiceFromQuery() {
    const query = parseQuery().query;
    if (query.service) {
      const serviceDef = this.services[query.service];
      if (serviceDef) {
        const urlValues = {};
        for (const key in query) {
          if (key.substring(0, 6) === "field:") {
            const fieldName = key.substring(6);
            urlValues[fieldName] = query[key];
          }
        }
        this.startService(query.service, {
          autoGo: true,
          defaultValues: urlValues,
        });
      } else {
        console.error("Failed to load service specified in ?service=");
      }
    }
  }
}

export default Application;
