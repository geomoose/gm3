import React, { useEffect, useState } from "react";
import { connect, Provider } from "react-redux";

import { changeTool } from "../../actions/map";
import { setServiceStep, finishService } from "../../actions/query";

import ServiceForm from "../serviceForm";
import Results from "./results";
import MeasureTool from "../measure";
import { LoadingIndicator } from "./loading";
import EmptyPlaceholder from "./empty";

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
  setServiceStep,
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

      if (serviceDef.autoGo !== true) {
        setServiceReady(-1);
      }
    }
  }, [
    serviceReady,
    serviceDef,
    changeTool,
    fieldValues,
    selectionFeatures,
    serviceInstance,
  ]);

  // This will return the user to the ServiceForm
  //  if keep alive has been set to true and autoGo
  //  is set to false.
  useEffect(() => {
    if (
      !serviceDef?.autoGo &&
      serviceReady < 0 &&
      selectionFeatures.length > 0
    ) {
      setServiceStep(SERVICE_STEPS.START);
    }
  }, [
    serviceDef,
    serviceReady,
    selectionFeatures,
    serviceInstance,
    setServiceStep,
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
          finishService();
        }}
      />
    );
  } else if (serviceStep === SERVICE_STEPS.LOADING) {
    contents = <LoadingIndicator />;
  } else if (serviceStep === SERVICE_STEPS.RESULTS) {
    contents = <Results serviceDef={serviceDef} />;
  } else {
    contents = <EmptyPlaceholder />;
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
  setServiceStep,
};

export default connect(mapStateToProps, mapDispatchToProps)(ServiceManager);
