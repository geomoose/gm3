/** Grunt Tasks for GeoMoose
 *
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
 */

var webpackConfig = require('./webpack.config');

module.exports = function(grunt) {
    grunt.loadNpmTasks('gruntify-eslint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-webpack');

    grunt.initConfig({
        // linting task. Used to ensure code is clean
        //  before trying to build.
        eslint: {
            options: {
                configFile: 'eslint.config.js',
            },
            target: ['src/**/*.jsx', 'src/**/*.js']
        },

        // copies useful files places.
        copy: {
            // this will copy the "test" files into dist,
            //  used for 'rapid' development work.
            test: {
                files: [
                    {expand: true, flatten: true, src: ['src/test.*'], dest: 'dist/'},
                ]
            }
        },

        less: {
            build: {
                options: {
                    paths: ['src/less'],
                },
                files: {
                    'dist/geomoose.css' : 'src/less/geomoose.less'
                }
            }
        },

        webpack: {
            optons: webpackConfig,
        },

        'webpack-dev-server': {
            options: {
                webpack: webpackConfig,
                publicPath: "./"
            },
            start: {
                webpack: webpackConfig,
                keepAlive: true,
                hot: true,
            }
        }
    });

    grunt.task.registerTask('lint', ['eslint']);

    grunt.task.registerTask('serve', ['copy:test', 'webpack-dev-server:start']);

    grunt.task.registerTask('build', ['webpack']);
};

