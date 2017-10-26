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
var package = require('./package.json');

var fs = require('fs');
var license_text = fs.readFileSync('LICENSE', {encoding: 'utf8'});

module.exports = {
    devtool: 'source-map',
    entry: [
        'babel-polyfill',
        './src/'
    ],

    module: {
        loaders: [{
            test: /\.(jsx|js)$/,
            loaders: ['babel'],
            include: [
                path.join(__dirname, 'src'),
                path.join(__dirname, 'node_modules/'),
            ],
            exclude: function(absPath) {
                var acceptable = ['ol', 'mapbox-to-ol-style', '@mapbox', 'jsts'];
                if(absPath.indexOf('node_modules') < 0) {
                    return false;
                }

                for(var i = 0, ii = acceptable.length; i < ii; i++) {
                    if(absPath.indexOf(acceptable[i]) >= 0) {
                        return false;
                    }
                }
            },
        }, {
            test: /\.json$/,
            loader: 'json-loader',
        }]
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    output: {
        path: __dirname + '/dist',
        publicPath: '/',
        filename: 'geomoose.min.js',
        library: ['gm3'],
        libraryTarget: 'umd'
    },
    externals: {
        openlayers: 'ol',
    },
    plugins: [
        new webpack.DefinePlugin({
            GM_VERSION: JSON.stringify(package.version),
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.BannerPlugin(license_text, {raw: true})
    ]
};
