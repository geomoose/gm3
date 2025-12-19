import React, { useCallback, useEffect, useState } from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";

import { zoomToExtent } from "../../actions/map";
import { bufferResults, finishService } from "../../actions/query";
import { DEFAULT_RESULTS_CONFIG } from "../../defaults";
import { getExtentForQuery } from "../../util";
import { getQueryResults } from "../../selectors/query";

import Modal from "../modal";

export const QueryResults = ({
  serviceDef,
  query,
  allResults,
  results,
  resultsConfigFromConf,
  config,
  t,
  zoomToExtent,
  bufferResults,
  finishService,
}) => {
  const [showTooManyFeatures, setShowTooManyFeatures] = useState(false);
  // These shim the new query format to the old API
  // TODO: Break this in 4.0
  const queryId = "query-id-0";
  const queryDef = {
    ...query,
    // this will filter down to just matching results
    results,
  };

  const zoomToResults = useCallback(() => {
    const extent = getExtentForQuery(allResults);
    if (extent) {
      zoomToExtent(extent);
    }
  }, [allResults, zoomToExtent]);

  useEffect(() => {
    if (query.runOptions && query.runOptions.zoomToResults) {
      zoomToResults();
    }
  }, [query, zoomToResults]);

  let htmlContents = "";
  if (serviceDef.renderQueryResults) {
    serviceDef.renderQueryResults(queryId, queryDef);
  }
  if (serviceDef.resultsAsHtml) {
    htmlContents = serviceDef.resultsAsHtml(queryId, queryDef);
  }

  const resultsConfig = {
    ...resultsConfigFromConf,
    ...serviceDef.resultsConfig,
  };

  // By default show the summary, unless showSummary is explicitly
  //  set to false.
  const showHeader = serviceDef.showHeader !== false;

  // this is a little ungangly but it will help those who
  //  forget to specify a results title.
  const serviceTitle = serviceDef.resultsTitle || `${serviceDef.title} Results`;

  let layerCount = 0,
    allFeatureCount = 0;
  for (const path in allResults) {
    if (allResults[path].failed !== true) {
      layerCount += 1;
      allFeatureCount += allResults[path].length;
    }
  }
  let featureCount = 0;
  for (const path in results) {
    featureCount += results[path].length;
  }

  const bufferEnabled = featureCount <= config.bufferMaxFeatures;

  return (
    <div>
      <Modal
        open={showTooManyFeatures}
        options={[{ value: "okay", label: t("Close") }]}
        onClose={() => {
          setShowTooManyFeatures(false);
        }}
        title={t("too-many-features-title")}
      >
        {t("too-many-features-description", { max: config.bufferMaxFeatures })}
      </Modal>

      <div className="results-header">{t(serviceTitle)}</div>
      <div className="results-query-id">{queryId}</div>
      {showHeader && (
        <div className="results-info">
          <button className="results-info-item buffer-all" onClick={() => finishService()}>
            <div className="label">{t("results-clear")}</div>
            <div className="value">
              <span className="icon clear"></span>
            </div>
          </button>

          {resultsConfig.showBufferAll && (
            <button
              className="results-info-item buffer-all"
              onClick={() => {
                if (bufferEnabled) {
                  bufferResults();
                } else {
                  setShowTooManyFeatures(true);
                }
              }}
            >
              <div className="label">{t("buffer-all")}</div>
              <div className="value">
                <span className="icon buffer"></span>
              </div>
            </button>
          )}

          {resultsConfig.showZoomToAll && (
            <button className="results-info-item zoomto" onClick={zoomToResults}>
              <div className="label">{t("zoomto-results")}</div>
              <div className="value">
                <span className="icon zoomto"></span>
              </div>
            </button>
          )}
        </div>
      )}

      <div className="results-info-counts">
        {showHeader && resultsConfig.showLayerCount && (
          <div className="results-info-item layers-count">
            <div className="label">{t("layers")}</div>
            <div className="value">{layerCount}</div>
          </div>
        )}
        {showHeader && resultsConfig.showFeatureCount && (
          <div className="results-info-item features-count">
            <div className="label">{t("features")}</div>
            <div className="value">{featureCount}</div>
          </div>
        )}

        {showHeader &&
          resultsConfig.showFeatureCount &&
          featureCount < allFeatureCount && (
            <div className="results-info-item filtered-features">
              {t(
                "The search returned {{allFeatureCount}} results. {{missing}} results are filtered out, and the remaining {{featureCount}} results are displayed.",
                {
                  allFeatureCount: allFeatureCount,
                  missing: allFeatureCount - featureCount,
                  featureCount: featureCount,
                }
              )}
            </div>
          )}
      </div>

      {showHeader && allFeatureCount === 0 && (
        <div className="info-box">
          {t(
            "Your query did not return any results. Adjust your selection area or filters and try again."
          )}
        </div>
      )}
      <div className="results" dangerouslySetInnerHTML={{ __html: htmlContents }} />
    </div>
  );
};

const mapStateToProps = (state) => ({
  config: {
    bufferMaxFeatures: 100,
    ...state.config.query,
  },
  query: state.query.query,
  allResults: state.query.results,
  results: getQueryResults(state),
  resultsConfigFromConf: { ...DEFAULT_RESULTS_CONFIG, ...state.config.results },
});

const mapDispatchToProps = {
  zoomToExtent,
  bufferResults,
  finishService,
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(QueryResults));
