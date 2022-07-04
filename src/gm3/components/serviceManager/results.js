import React, {useState} from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

import { zoomToExtent } from '../../actions/map';
import { bufferResults } from '../../actions/query';
import { DEFAULT_RESULTS_CONFIG } from '../../defaults';
import { getExtentForQuery } from '../../util';


import Modal from '../modal';


export const QueryResults = ({
    serviceDef,
    query,
    results,
    resultsConfigFromConf,
    config,
    t,
    zoomToExtent,
    bufferResults,
}) => {
    const [showTooManyFeatures, setShowTooManyFeatures] = useState(false);
    // These shim the new query format to the old API
    // TODO: Break this in 4.0
    const queryId = 'query-id-0';
    const queryDef = {
        ...query,
        results,
    };

    let htmlContents = '';
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

    let layerCount = 0, featureCount = 0;
    for (const path in results) {
        if (results[path].failed !== true) {
            layerCount += 1;
            featureCount += results[path].length;
        }
    }

    const bufferEnabled = featureCount <= config.bufferMaxFeatures;

    return (
        <div>
            <Modal
                open={showTooManyFeatures}
                options={[{value: 'okay', label: t('Close')}]}
                onClose={() => {
                    setShowTooManyFeatures(false);
                }}
                title={t('too-many-features-title')}
            >
                {t('too-many-features-description', {max: config.bufferMaxFeatures})}
            </Modal>

            <div className='results-header'>
                { t(serviceTitle) }
                <div className='results-tools'>
                    <i
                        title={t('results-clear')}
                        className='icon clear'
                        onClick={() => {
                            // this.props.removeQuery(queryId);
                        }}>
                    </i>
                </div>
            </div>
            <div className='results-query-id'>{ queryId }</div>
            { showHeader && (
                <div className='results-info'>
                    {resultsConfig.showFeatureCount && (
                        <div className='results-info-item features-count'>
                            <div className='label'>{t('features')}</div>
                            <div className='value'>{ featureCount }</div>
                        </div>
                    )}

                    {resultsConfig.showLayerCount && (
                        <div className='results-info-item layers-count'>
                            <div className='label'>{t('layers')}</div>
                            <div className='value'>{ layerCount }</div>
                        </div>
                    )}

                    {resultsConfig.showBufferAll && (
                        <div
                            className='results-info-item buffer-all'
                        >
                            <div className='label'>{t('buffer-all')}</div>
                            <div className='value' onClick={() => {
                                if (bufferEnabled) {
                                    bufferResults();
                                } else {
                                    setShowTooManyFeatures(true);
                                }
                            }}>
                                <span className='icon buffer'></span>
                            </div>
                        </div>
                    )}

                    {resultsConfig.showZoomToAll && (
                        <div className='results-info-item zoomto'>
                            <div className='label'>{t('zoomto-results')}</div>
                            <div className='value' onClick={() => {
                                const extent = getExtentForQuery(results);
                                if (extent) {
                                    zoomToExtent(extent);
                                }
                            }}>
                                <span className='icon zoomto'></span>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div dangerouslySetInnerHTML={{__html: htmlContents}} />
        </div>
    );
}



const mapStateToProps = state => ({
    config: {
        bufferMaxFeatures: 100,
        ...state.config.query,
    },
    query: state.query.query,
    results: state.query.results,
    resultsConfigFromConf: {...DEFAULT_RESULTS_CONFIG, ...state.config.results},
});

const mapDispatchToProps = {
    zoomToExtent,
    bufferResults,
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(QueryResults));
