
global.requestAnimationFrame = function(callback) {
    setTimeout(callback, 0);
};

try {
    const xmldom = require('xmlshim');
    global.XMLSerializer = xmldom.XMLSerializer;
} catch(err) {
    // pass... sad pand, no XMLSerializer.
}

try {
    require('canvas');
} catch(err) {
    global.HAS_CANVAS = false;
    HTMLCanvasElement.prototype.getContext = () => {
        return {};
    };
}
