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
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-gitinfo');
    grunt.loadNpmTasks('grunt-webpack');
    // load our custom tasks
    grunt.loadTasks('./src/tasks');

    grunt.initConfig({
        // linting task. Used to ensure code is clean
        //  before trying to build.
        eslint: {
            options: {
                configFile: 'eslint.config.js',
            },
            target: ['src/**/*.jsx', 'src/**/*.js']
        },

        // line the CSS
        lintless: {
            all: {
                files: [
                    {src: ['src/less/**/*.less']}
                ]
            }
        },


        // makes a compressed archive of the SDK release
        compress: {
             main: {
                 options: {
                     archive: 'gm3-sdk-<%= gitinfo.local.branch.current.shortSHA %>.zip'
                 },
                 files: [
                     { src: [
                           'demo/**',
                           'dist/**',
                           'docs/**',
                           'eslint.config.js',
                           'Gruntfile.js',
                           'LICENSE',
                           'package.json',
                           'README.md',
                           'src/**',
                           'tests/**',
                           'webpack.config.js',
                           'webpack-deploy.config.js'
                       ], dest: 'geomoose' }
                 ]
             }
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
                    },
                    {
                        expand: true, flatten: true,
                        src: ['node_modules/mapskin/fonts/*'],
                        dest: 'dist/fonts/'
                    }
                ]
            },
            ol: {
                files: [
                    {
                        src: ['node_modules/openlayers/dist/ol.js'],
                        dest: 'dist/ol.js'
                    }
                ]
            },
            services: {
                files: [
                    {
                        expand: true, flatten: true,
                        src: ['src/services/*.js'],
                        dest: 'dist/services/'
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
            },
            less: {
                files: ['src/less/**/*'],
                tasks: ['less:build']
            },
            services: {
                files: ['src/services/*'],
                tasks: ['copy:services']
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

    grunt.task.registerTask('lint', ['lintless', 'eslint']);

    grunt.task.registerTask('serve', ['webpack-dev-server:start', 'watch']);

    // only build the non-minified version.
    grunt.task.registerTask('build-dev', ['eslint', 'copy:services', 'webpack:build-dev']);

    // update the css and fonts.
    grunt.task.registerTask('build-css', ['less:build', 'copy:fonts']);

    // build everything
    grunt.task.registerTask('build', ['eslint', 'webpack:build-dev', 'webpack:build-deploy', 'build-css', 'copy:ol', 'copy:services']);

    // build release.zip
    grunt.task.registerTask('build-release', ['build', 'gitinfo', 'compress']);
};
