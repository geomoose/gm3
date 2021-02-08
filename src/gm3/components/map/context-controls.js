import React, {useEffect, useCallback} from 'react';

import {EDIT_LAYER_NAME} from '../../defaults';
import {featureToJson} from '../../util';

import MapButton from './button';

const EditLayerControls = ({editPath, saveFeature, olLayers, changeTool, setFeatures}) => {
    const clearChanges = useCallback(() => {
        setFeatures(EDIT_LAYER_NAME, []);

        // return the modify tool
        changeTool('Modify', editPath);
    }, [changeTool, setFeatures, EDIT_LAYER_NAME]);

    // all done, wrap it up, unload features and the tool
    const done = useCallback(() => {
        setFeatures(EDIT_LAYER_NAME, []);
        changeTool(null);
    });

    const saveChanges = useCallback(evt => {
        // the edit layer should only ever have one feature!
        const features = olLayers[EDIT_LAYER_NAME]
            .getSource()
            .getFeatures()
            .slice(0, 1)
            .map(f => featureToJson(f));

        if (features.length > 0) {
            const feature = features[0];
            saveFeature(editPath, feature);
            clearChanges();
        }
    }, [olLayers, EDIT_LAYER_NAME]);

    useEffect(() => {
        const keyFn = evt => {
            let prevent = false;
            if (evt.key === 'Escape') {
                clearChanges();
                prevent = true;
            } else if (evt.key === 's' && evt.ctrlKey) {
                saveChanges();
                prevent = true;
            } else if (evt.key === 'x' && evt.ctrlKey) {
                done();
                prevent = true;
            }

            if (prevent) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        };

        document.addEventListener('keydown', keyFn);
        return () => {
            document.removeEventListener('keydown', keyFn);
        };
    }, [clearChanges, saveChanges]);

    return (
        <React.Fragment>
            <MapButton
                label="save-changes"
                icon="icon save"
                index={4}
                onClick={saveChanges}
            />

            <MapButton
                disabled
                label="undo-changes"
                icon="icon undo"
                index={3}
            />

            <MapButton
                label="cancel-changes"
                icon="icon cancel"
                index={2}
                onClick={clearChanges}
            />

            <MapButton
                label="end-drawing"
                icon="icon stop"
                index={1}
                onClick={done}
            />
        </React.Fragment>
    );
}


const StopControl = ({changeTool, setFeatures}) => {
    const done = useCallback(() => {
        setFeatures(EDIT_LAYER_NAME, []);
        changeTool(null);
    });

    useEffect(() => {
        const keyFn = evt => {
            if (evt.key === 'Escape') {
                done();
                evt.preventDefault();
                evt.stopPropagation()
            }
        };

        document.addEventListener('keydown', keyFn);
        return () => {
            document.removeEventListener('keydown', keyFn);
        };
    }, [changeTool]);

    return (
        <MapButton
            label="end-drawing"
            icon="icon stop"
            index={1}
            onClick={() => done()}
        />
    );
}

const ContextControls = ({
    changeTool,
    editPath,
    saveFeature,
    setFeatures,
    olLayers,
    interactionType,
    activeSource,
    setZoom,
    zoom
}) => {

    let controls = false;
    // do not bother rendering anything if the interaction is null
    if (!interactionType) {
        // return false;
    } else if (
        interactionType.indexOf('Modify') >= 0 &&
        activeSource === `${EDIT_LAYER_NAME}/${EDIT_LAYER_NAME}`
    ) {
        controls = (
            <EditLayerControls
                olLayers={olLayers}
                changeTool={changeTool}
                saveFeature={saveFeature}
                editPath={editPath}
                setFeatures={setFeatures}
            />
        );
    } else {
        controls = (
            <StopControl
                changeTool={changeTool}
                setFeatures={setFeatures}
            />
        );
    }

    return (
        <React.Fragment>
            <MapButton
                label="zoom-in"
                icon="icon zoom-in"
                index={0}
                onClick={() => setZoom(zoom + 1)}
            />

            <MapButton
                label="zoom-out"
                icon="icon zoom-out"
                index={0}
                onClick={() => setZoom(zoom - 1)}
            />

            <span style={{display: 'inline-block', width: 16}}></span>
            {controls}
        </React.Fragment>
    )
}

export default ContextControls;
