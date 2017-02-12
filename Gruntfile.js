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
var webpackDeployConfig = require('./webpack-deploy.config');

module.exports = function(grunt) {
    grunt.loadNpmTasks('gruntify-eslint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
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
            },
            fonts: {
                files: [
                    {
                        expand: true, flatten: true,
                        src: ['node_modules/font-awesome/fonts/*'],
                        dest: 'dist/fonts/'
                    }
                ]
            }
        },

        less: {
            build: {
                options: {
                    paths: ['src/less'],
                },
                files: {
                    'dist/css/geomoose.css' : 'src/less/gm3.less'
                }
            }
        },

        watch: {
            gm3: {
                files: ['src/gm3/**/*'],
                tasks: ['webpack:build-dev'],
                options: {
                    spawn: false,
                }
            }
        },

        webpack: {
            'build-dev': webpackConfig,
            'build-deploy': webpackDeployConfig
        },

        'webpack-dev-server': {
            options: {
                webpack: webpackConfig,
                publicPath: "./"
            },
            start: Object.assign({}, webpackConfig.devServer)
        }
    });

    grunt.task.registerTask('lint', ['eslint']);

    grunt.task.registerTask('serve', ['webpack-dev-server:start', 'watch:gm3']);

    // only build the non-minified version.
    grunt.task.registerTask('build-dev', ['eslint', 'webpack:build-dev']);

    // update the css and fonts.
    grunt.task.registerTask('build-css', ['less:build', 'copy:fonts']);

    // build everything
    grunt.task.registerTask('build', ['eslint', 'webpack:build-dev', 'webpack:build-deploy', 'build-css']);
};
