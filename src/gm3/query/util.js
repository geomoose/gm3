import {getSquareBuffer} from '../util';

const getPixelTolerance = (querySource, defaultPx = 10) => {
    // the default pixel tolerance is 10 pixels.
    let pxTolerance = defaultPx;
    try {
        if (querySource.config['pixel-tolerance']) {
            pxTolerance = parseFloat(querySource.config['pixel-tolerance']);
        }
    } catch (err) {
        // swallow the error
    }
    return pxTolerance;
};

export const applyPixelTolerance = (queryFeature, querySource, resolution, defaultPxTolerance) => {
    const pxTolerance = getPixelTolerance(querySource, defaultPxTolerance);
    if (pxTolerance > 0 && queryFeature.geometry.type === 'Point') {
        // buffer point is in pixels,
        //  this converts pixels to ground units
        const width = pxTolerance * resolution;
        return getSquareBuffer(
            queryFeature.geometry.coordinates,
            width
        );
    }
    return queryFeature;
};


