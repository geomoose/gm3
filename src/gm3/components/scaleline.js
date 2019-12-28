/**
 * This code is a refactored version of what comes in the
 * ol/control/ScaleLine. It uses much of the same logic but
 * instead of rendering the scale line it returns the metadata
 * for rendering.
 */
import {getPointResolution, METERS_PER_UNIT} from 'ol/proj';
import ProjUnits from 'ol/proj/Units';

/**
 * Units for the scale line. Supported values are `'degrees'`, `'imperial'`,
 * `'nautical'`, `'metric'`, `'us'`.
 * @enum {string}
 */
const Units = {
    DEGREES: 'degrees',
    IMPERIAL: 'imperial',
    NAUTICAL: 'nautical',
    METRIC: 'metric',
    US: 'us'
};

const LEADING_DIGITS = [1, 2, 5];

const DEFAULT_OPTIONS = {
    minWidth: 64,
    multiplier: 1,
};

export function getScalelineInfo(viewState, units, inOpts = {}) {
    const options = Object.assign({}, DEFAULT_OPTIONS, inOpts);

    const center = viewState.getCenter();
    const projection = viewState.getProjection();
    const pointResolutionUnits = units === Units.DEGREES ?
        ProjUnits.DEGREES :
        ProjUnits.METERS;
    if (!projection) {
        return {label: '', width: 0, error: 'no-projection'};
    }
    const resolution = viewState.getResolution();
    let pointResolution =
        getPointResolution(projection, resolution * options.multiplier, center, pointResolutionUnits);
    if (projection.getUnits() !== ProjUnits.DEGREES && projection.getMetersPerUnit()
      && pointResolutionUnits === ProjUnits.METERS) {
        pointResolution *= projection.getMetersPerUnit();
    }

    let nominalCount = options.minWidth * pointResolution;
    let suffix = '';
    if (units === Units.DEGREES) {
        const metersPerDegree = METERS_PER_UNIT[ProjUnits.DEGREES];
        if (projection.getUnits() === ProjUnits.DEGREES) {
            nominalCount *= metersPerDegree;
        } else {
            pointResolution /= metersPerDegree;
        }
        if (nominalCount < metersPerDegree / 60) {
            // seconds
            suffix = '\u2033';
            pointResolution *= 3600;
        } else if (nominalCount < metersPerDegree) {
            // minutes
            suffix = '\u2032';
            pointResolution *= 60;
        } else {
            // degrees
            suffix = '\u00b0';
        }
    } else if (units === Units.IMPERIAL) {
        if (nominalCount < 0.9144) {
            suffix = 'in';
            pointResolution /= 0.0254;
        } else if (nominalCount < 1609.344) {
            suffix = 'ft';
            pointResolution /= 0.3048;
        } else {
            suffix = 'mi';
            pointResolution /= 1609.344;
        }
    } else if (units === Units.NAUTICAL) {
        pointResolution /= 1852;
        suffix = 'nm';
    } else if (units === Units.METRIC) {
        if (nominalCount < 0.001) {
            suffix = 'μm';
            pointResolution *= 1000000;
        } else if (nominalCount < 1) {
            suffix = 'mm';
            pointResolution *= 1000;
        } else if (nominalCount < 1000) {
            suffix = 'm';
        } else {
            suffix = 'km';
            pointResolution /= 1000;
        }
    } else if (units === Units.US) {
        if (nominalCount < 0.9144) {
            suffix = 'in';
            pointResolution *= 39.37;
        } else if (nominalCount < 1609.344) {
            suffix = 'ft';
            pointResolution /= 0.30480061;
        } else {
            suffix = 'mi';
            pointResolution /= 1609.3472;
        }
    } else {
        return {
            label: '',
            width: 0,
            error: 'bad-units',
        };
    }

    let i = 3 * Math.floor(
        Math.log(options.minWidth * pointResolution) / Math.log(10));
    let count, width;
    while (true) {
        count = LEADING_DIGITS[((i % 3) + 3) % 3] *
          Math.pow(10, Math.floor(i / 3));
        width = Math.round(count / pointResolution);
        if (isNaN(width)) {
            return {
                label: '',
                width: 0,
                error: 'width-is-nan',
            };
        } else if (width >= options.minWidth) {
            break;
        }
        ++i;
    }

    return {
        label: `${count} ${suffix}`,
        width,
    }
}
