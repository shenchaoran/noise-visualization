'use strict';

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    var path = require('path');

    /**
     * Resolve external project resource as file path
     */
    function resolvePath(project, file) {
        return path.join(path.dirname(require.resolve(project)), file);
    }

    // project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        sass: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'public/css/Source',
                    src: ['*.scss'],
                    dest: 'public/css/Source',
                    ext: '.css'
                }]
            }
        },

        watch: {
            options: {
                livereload: 2345
            },
            js: {
                files: ['public/js/Source/*.js'],
                // tasks: ['browserify:watch']
            },
            css: {
                files: ['public/css/Source/*.css'],
                // tasks: ['copy:css']
            },
            ejs: {
                files: ['views/**/*.ejs']
            },
            sass: {
                files: ['public/css/Source/*.scss'],
                tasks: ['sass']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', [
        'sass',
        'watch'
    ]);
};