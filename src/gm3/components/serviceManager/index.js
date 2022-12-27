import React, { useEffect, useState } from "react";
import { connect, Provider } from "react-redux";

import { changeTool } from "../../actions/map";
import { finishService } from "../../actions/query";

import ServiceForm from "../serviceForm";
import Results from "./results";
import MeasureTool from "../measure";
import { LoadingIndicator } from "./loading";

import { SERVICE_STEPS } from "../../reducers/query";
import { normalizeFieldValues, normalizeSelection } from "../../query/util";

const ServiceManager = function ({
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
    setServiceReady(-1);
    setFieldValues({});
  }, [serviceDef]);

  useEffect(() => {
    if (serviceDef && serviceReady === serviceInstance) {
      // when keepAlive is true, the background tool can stay on.
      if (serviceDef.keepAlive !== true) {
        changeTool(null);
      }

      const selection = normalizeSelection(selectionFeatures);
      const fields = normalizeFieldValues(serviceDef, fieldValues);
      serviceDef.query(selection, fields);
    }
  }, [
    serviceReady,
    serviceDef,
    changeTool,
    fieldValues,
    selectionFeatures,
    serviceInstance,
  ]);

  let contents = false;

  if (serviceName === "measure") {
    contents = <MeasureTool store={store} />;
  } else if (serviceDef && serviceStep === SERVICE_STEPS.START) {
    contents = (
      <ServiceForm
        serviceName={serviceName}
        serviceDef={serviceDef}
        defaultValues={defaultValues}
        onSubmit={(values) => {
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
    contents = <LoadingIndicator />;
  } else if (serviceStep === SERVICE_STEPS.RESULTS) {
    contents = <Results serviceDef={serviceDef} />;
  }

  return (
    <Provider store={store}>
      <div className="service-manager">{contents}</div>
    </Provider>
  );
};

const mapStateToProps = (state) => ({
  serviceName: state.query.serviceName,
  serviceStep: state.query.step,
  serviceInstance: state.query.instance,
  selectionFeatures: state.mapSources.selection
    ? state.mapSources.selection.features
    : [],
  defaultValues: state.query.defaultValues,
});

const mapDispatchToProps = {
  changeTool,
  finishService,
};

export default connect(mapStateToProps, mapDispatchToProps)(ServiceManager);
