module.exports = function(grunt) {

	'use strict';

	// Project configuration.
	grunt.initConfig({
		copy: {
			bootstrap: {
				files: [
					{
						expand: true,
						cwd: 'node_modules/bootstrap/dist',
						src : ['**'],
						dest: 'build/public/',
					},
				]
			},
			jquery: {
				files: [
					{
						expand: true,
						cwd: 'node_modules/jquery/dist',
						src : ['**'],
						dest: 'build/public/js/',
					},
				]
			},
			nuage: {
				files: [
					{
						expand: true,
						src : ['lib/**²'],
						dest: 'build/',
					},
					{
						expand: true,
						src : ['public/**'],
						dest: 'build/',
					},
				]
			}
		},
		node_version: {
			options: {
				alwaysInstall: false,
				errorLevel: 'warn',
				globals: [],
				maxBuffer: 200*1024,
				nvm: false,
				override: ''
			}
		},
		http: {
			getHome: {
				options: {
					url: 'your/url.com',
				},
			}
		},
		nodeunit: {
			files: ['test/**/*_test.js'],
		},
		jsonlint: {
			config: {
				src: [ 'config.*.json' ]
			}
		},
		jshint: {
			options: {
				esnext: true,
				node: true,
				camelcase: true
			},
			lib: {
				src: ['lib/**/*.js']
			},
			test: {
				src: ['test/**/*.js']
			},
			gruntfile: {
				options: {
					camelcase: false
				},
				src: ['Gruntfile.js']
			},
		},
		jscs: {
			options: {
				fix: true,
				verbose: true,
				config: '.jscsrc'
			},
			lib: {
				files: [
					{ src: 'lib/**/*.js' }
				],
				options: {
					esnext: true,
				},
			},
			test: {
				files: [
					{ src: 'test/**/*.js' }
				]
			},
			gruntfile: {
				files: [
					{ src: 'Gruntfile.js' }
				]
			}
		},
		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile','jscs:gruntfile']
			},
			lib: {
				files: '<%= jshint.lib.src %>',
				tasks: ['jshint:lib', 'jscs:lib','nodeunit']
			},
			test: {
				files: '<%= jshint.test.src %>',
				tasks: ['jshint:test', 'jscs:test', 'nodeunit']
			},
		},
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks("grunt-jscs");
	grunt.loadNpmTasks('grunt-jsonlint');
	grunt.loadNpmTasks('grunt-node-version');
	grunt.loadNpmTasks('grunt-http');

	// Default task.
	grunt.registerTask('default', [
		'node_version',
		'copy:bootstrap',
		'copy:jquery',
		'copy:nuage',
	]);
	grunt.registerTask('test', [
		'jshint',
		'jsonlint',
		'jscs',
		'default',
		'nodeunit'
	]);

};