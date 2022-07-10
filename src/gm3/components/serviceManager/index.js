import React, {useEffect, useState} from 'react';
import { connect, Provider } from 'react-redux';

import { changeTool } from '../../actions/map';
import { finishService } from '../../actions/query';

import ServiceForm from '../serviceForm';
import Results from './results';
import MeasureTool from '../measure';
import { LoadingIndicator } from './loading';

import { SERVICE_STEPS } from '../../reducers/query';


function normalizeSelection(selectionFeatures) {
    // OpenLayers handles MultiPoint geometries in an awkward way,
    // each feature is a 'MultiPoint' type but only contains one feature,
    //  this normalizes that in order to be submitted properly to query services.
    if(selectionFeatures && selectionFeatures.length > 0) {
        if(selectionFeatures[0].geometry.type === 'MultiPoint') {
            const all_coords = [];
            for(const feature of selectionFeatures) {
                if(feature.geometry.type === 'MultiPoint') {
                    all_coords.push(feature.geometry.coordinates[0]);
                }
            }
            return [{
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'MultiPoint',
                    coordinates: all_coords
                }
            }];
        }
    }
    return selectionFeatures;
}


const ServiceManager = function({
    changeTool,
    services,
    store,
    serviceName,
    serviceStep,
    defaultValues,
    selectionFeatures,
    finishService,
    serviceInstance,
}) {
    const serviceDef = services[serviceName];

    const [fieldValues, setFieldValues] = useState({});
    const [serviceReady, setServiceReady] = useState(false);

    // when the service name changes, reset the field values
    useEffect(() => {
        setServiceReady(false);
        setFieldValues({});
    }, [serviceDef]);

    useEffect(() => {
        if (serviceDef && serviceReady === serviceInstance) {
            const selection = normalizeSelection(selectionFeatures);
            const fields = serviceDef.fields.map(field => ({
                name: field.name,
                value: fieldValues[field.name] || field.default,
            }));

            // when keepAlive is true, the background tool can stay on.
            if (serviceDef.keepAlive !== true) {
                changeTool(null);
            }
            serviceDef.query(selection, fields);
        }
    }, [serviceReady, serviceDef, changeTool, fieldValues, selectionFeatures]);

    let contents = false;

    if (serviceName === 'measure') {
        contents = <MeasureTool store={store} />;
    } else if (serviceDef && serviceStep === SERVICE_STEPS.START) {
        contents = (
            <ServiceForm
                serviceName={serviceName}
                serviceDef={serviceDef}
                defaultValues={defaultValues}
                onSubmit={values => {
                    setFieldValues(values);
                    setServiceReady(serviceInstance);
                }}
                onCancel={() => {
                    changeTool(null);
                    // this.props.onServiceFinished();
                }}
            />
        );
    } else if (serviceStep === SERVICE_STEPS.LOADING) {
        contents = (
            <div>
                <LoadingIndicator />
                Loading...
            </div>
        );
    } else if (serviceStep === SERVICE_STEPS.RESULTS) {
        contents = (
            <Results serviceDef={serviceDef} />
        );
    }

    return (
        <Provider store={store}>
            <div className='service-manager'>
                <LoadingIndicator />
                { contents }
            </div>
        </Provider>
    );
}

const mapStateToProps = state => ({
    serviceName: state.query.serviceName,
    serviceStep: state.query.step,
    serviceInstance: state.query.instance,
    selectionFeatures: state.mapSources.selection ? state.mapSources.selection.features : [],
});

const mapDispatchToProps = {
    changeTool,
    finishService,
};

export default connect(mapStateToProps, mapDispatchToProps)(ServiceManager);
