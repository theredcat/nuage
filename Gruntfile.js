var exec = require('child_process').spawnSync;

module.exports = function( grunt ) {

	"use strict";

	var taskListTest = [
		"jshint",
		"jsonlint",
		"jscs",
		"default",
		"nodeunit"
	];
	var taskListDefault = [
		"node_version",
		"copy:bootstrap",
		"copy:jquery",
		"copy:nuage"
	];

	// Project configuration.
	grunt.initConfig({
		copy: {
			bootstrap: {
				files: [
					{
						expand: true,
						cwd: "node_modules/bootstrap/dist",
						src: [ "**" ],
						dest: "build/public/"
					}
				]
			},
			jquery: {
				files: [
					{
						expand: true,
						cwd: "node_modules/jquery/dist",
						src: [ "**" ],
						dest: "build/public/js/"
					}
				]
			},
			nuage: {
				files: [
					{
						expand: true,
						src: [ "lib/**" ],
						dest: "build/"
					},
					{
						expand: true,
						src: [ "bin/**" ],
						dest: "build/"
					},
					{
						expand: true,
						src: [ "public/**" ],
						dest: "build/"
					},
					{
						expand: true,
						src: [ "config.*.json" ],
						dest: "build/"
					}
				]
			}
		},
		node_version: {
			options: {
				alwaysInstall: false,
				errorLevel: "warn",
				globals: [],
				maxBuffer: 200 * 1024,
				nvm: false,
				override: ""
			}
		},
		http: {
			getHome: {
				options: {
					url: "your/url.com"
				}
			}
		},
		nodeunit: {
			files: [ "test/**/*_test.js" ]
		},
		jsonlint: {
			config: {
				src: [ "config.*.json" ]
			},
			package: {
				src: [ "package.json" ]
			}
		},
		htmllint: {
			all: [ "build/**/*.html" ]
		},
		jshint: {
			options: {
				esnext: true,
				node: true,
				camelcase: true
			},
			bin: {
				src: [ "bin/**/*.js" ]
			},
			lib: {
				src: [ "lib/**/*.js" ]
			},
			test: {
				src: [ "test/**/*.js" ]
			},
			gruntfile: {
				options: {
					camelcase: false
				},
				src: [ "Gruntfile.js" ]
			}
		},
		jscs: {
			options: {
				fix: true,
				verbose: true,
				config: ".jscsrc"
			},
			bin: {
				files: [
					{ src: "bin/**/*.js" }
				],
				options: {
					esnext: true
				}
			},
			lib: {
				files: [
					{ src: "lib/**/*.js" }
				],
				options: {
					esnext: true
				}
			},
			test: {
				files: [
					{ src: "test/**/*.js" }
				]
			}
			//gruntfile: {
			//	files: [
			//		{ src: "Gruntfile.js" }
			//	]
			//}
		},
		watch: {
			gruntfile: {
				files: "<%= jshint.gruntfile.src %>",
				tasks: [ "jshint:gruntfile", "jscs:gruntfile" ]
			},
			lib: {
				files: "<%= jshint.lib.src %>",
				tasks: [ "jshint:lib", "jscs:lib", "nodeunit" ]
			},
			bin: {
				files: "<%= jshint.lib.src %>",
				tasks: [ "jshint:bin", "jscs:bin", "nodeunit" ]
			},
			test: {
				files: "<%= jshint.test.src %>",
				tasks: [ "jshint:test", "jscs:test", "nodeunit" ]
			}
		}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks( "grunt-contrib-nodeunit" );
	grunt.loadNpmTasks( "grunt-contrib-jshint" );
	grunt.loadNpmTasks( "grunt-contrib-watch" );
	grunt.loadNpmTasks( "grunt-contrib-copy" );
	grunt.loadNpmTasks( "grunt-jscs" );
	grunt.loadNpmTasks( "grunt-jsonlint" );
	grunt.loadNpmTasks( "grunt-node-version" );

	var returnValue = exec('java', ['-version']);
	if(returnValue.error) {
		grunt.log.error("Java not found. HTML Test won't be performed");
	} else {
		grunt.loadNpmTasks( "grunt-html" );
		taskListTest.push('htmllint');
	}
	grunt.loadNpmTasks( "grunt-http" );

	// Default task.
	grunt.registerTask( "default", taskListDefault);
	grunt.registerTask( "test", taskListTest);

};
