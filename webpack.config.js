/** Webpack Configuration.
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 GeoMoose
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */
var path = require('path');
var webpack = require('webpack');
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');

var package = require('./package.json');

var fs = require('fs');
var license_text = fs.readFileSync('LICENSE', {encoding: 'utf8'});

module.exports = env => {
    const isDevelopment = !env || env.production !== true;
    const PLUGINS = [
        new webpack.BannerPlugin(license_text),
        new webpack.DefinePlugin({
            GM_VERSION: JSON.stringify(package.version)
        }),
    ];

    let filename = env && env.outfile ? env.outfile : 'geomoose.js';

    if (!isDevelopment) {
        PLUGINS.push(new UglifyJsPlugin());
        filename = 'geomoose.min.js';
    }


    return {
        mode: isDevelopment ? 'development' : 'production',
        devtool: isDevelopment ? 'eval-source-map' : undefined,
        entry: [
            'babel-polyfill',
            'whatwg-fetch',
            './src/index.js'
        ],
        resolve: {
            extensions: [
                '.js', '.jsx',
            ],
        },
        module: {
            rules: [{
                test: /\.(jsx|js)$/,
                loaders: ['babel-loader'],
                include: [
                    path.join(__dirname, 'src'),
                    path.join(__dirname, 'node_modules/'),
                ],
                exclude: function(absPath) {
                    var acceptable = ['ol', 'mapbox-to-ol-style', '@mapbox', 'jsts', 'usng-map-collar'];
                    if(absPath.indexOf('node_modules') < 0) {
                        return false;
                    }

                    for(var i = 0, ii = acceptable.length; i < ii; i++) {
                        if(absPath.indexOf(acceptable[i]) >= 0) {
                            return false;
                        }
                    }
                    return true;
                }
            },
            /* JSON loader appears to be working,
             *  but this was left here for posterity
            {
                test: /\.json$/,
                loader: 'json-loader',
                exclude: [
                    path.join(__dirname, 'node_modules/'),
                ]
            }*/
            ]
        },
        output: {
            path: __dirname + '/dist',
            publicPath: '/',
            filename,
            library: ['gm3'],
            libraryTarget: 'umd'
        },
        devServer: {
            publicPath: '/examples/geomoose/dist',
            contentBase: './',
            port: 4000,
            proxy: [
                {
                    context: ['/mapserver'],
                    target: 'http://localhost:8000/',
                    secure: false
                },
                {
                    // point the example "geomoose" directories back
                    //  at the geomoose repository.
                    context: ['/examples/geomoose/'],
                    target: 'http://localhost:4000/',
                    pathRewrite: {'^/examples/geomoose' : '' },
                    secure: false
                },
            ]
        },
        plugins: PLUGINS,
    };
};
