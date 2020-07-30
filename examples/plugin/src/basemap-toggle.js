"use strict";

/** WARNING! This plug-in requries the experimental
 *  `addConnectedPlugin` API. This is the first test
 *  of this new style plug-in.
 *  Bonus: This plug-in does not require compiling!
 */

function ToggleLayer(React, props) {
    // this is a common way to short-hand React.createElement
    const e = React.createElement;
    return e('div', {
            key: props.path,
            style: {
                display: 'flex',
                overflow: 'hidden',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'width 1s',
                width: props.open ? '115px' : '0px',
            },
            onClick: props.onClick,
        },
            e('div', {
                style: {
                    textAlign: 'center',
                    width: '115px'
                },
            },
                e('img', {
                    src: props.src,
                    height: 100,
                    width: 100
                }),
            ),
            e('label', {
                style: {
                    textAlign: 'center',
                    margin: 0,
                    flex: 1,
                    width: '115px'
                }
            }, props.label)
        );
}


var BasemapToggle = {
    mapStateToProps: function(state) {
        return {
            mapSources: state.mapSources
        };
    },

    component: function(React, ownProps) {
        return function(props) {
            const layers = props.layers;
            const [isOpen, setOpen] = React.useState(false);
            const setVis = props.app.experimental.setLayerVisibility;
            const visibleLayers = props.app.getVisibleLayers();

            // show the 0th item if none of the toggles are
            //  selected.
            let active = 0;
            for (let i = 0, ii = layers.length; i < ii; i++) {
                if (layers.path !== '' && visibleLayers.indexOf(layers[i].path) >= 0) {
                    active = i;
                    break;
                }
            }

            return React.createElement('div',
                {
                    onMouseOver: function() {
                        setOpen(true);
                    },
                    onMouseOut: function() {
                        setOpen(false);
                    },
                    style: {
                        position: 'absolute',
                        bottom: '30px',
                        right: '10px',
                        borderRadius: '5px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        color: 'white',
                        padding: '5px',
                        display: 'flex'
                    }
                },
                layers.map(function(layer, idx) {
                    return ToggleLayer(React, {
                        label: layer.label,
                        src: layer.src,
                        path: layer.path,
                        open: isOpen || idx === active,
                        onClick: function() {
                            setVis(layer.path, true);
                            layers.forEach(function(offLayer) {
                                if (offLayer.path !== layer.path) {
                                    setVis(offLayer.path, false);
                                }
                            });
                        }
                    });
                })
            );
        }
    }
};
