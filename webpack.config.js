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
    devtool: 'eval-source-map',
    entry: [
        'webpack-dev-server/client?http://localhost:4000',
        'babel-polyfill',
        //'webpack/hot/only-dev-server',
        './src/' //index.jsx'
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
                return true;
            }
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
        filename: 'geomoose.js',
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
    externals: {
        //openlayers: 'ol',
    },
    plugins: [
        new webpack.BannerPlugin(license_text, {raw: true}),
        new webpack.DefinePlugin({
            GM_VERSION: JSON.stringify(package.version)
        })
    ]
};
