global.requestAnimationFrame = function(callback) {
    setTimeout(callback, 0);
};

try {
    require('canvas');
} catch(err) {
    global.HAS_CANVAS = false;
    HTMLCanvasElement.prototype.getContext = () => {
        return {};
    };
}
