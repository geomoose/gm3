const xmldom = require('xmlshim');

global.requestAnimationFrame = function(callback) {
    setTimeout(callback, 0);
};

global.XMLSerializer = xmldom.XMLSerializer;

try {
    require('canvas');
} catch(err) {
    global.HAS_CANVAS = false;
    HTMLCanvasElement.prototype.getContext = () => {
        return {};
    };
}
