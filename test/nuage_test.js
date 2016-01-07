"use strict";

var traceur = require( "traceur" );

traceur.require.makeDefault(function( filename ) {
	return filename.indexOf( "node_modules" ) === -1;
});


var config = require( "../build/config.dev.json");
var Nuage = require( "../build/lib/nuage.js" ).Nuage;
var http = require( "nodeunit-httpclient" ).create({
    port: config.http.port,
    path: "/",
    status: 200
});

module.exports = {
	setUp: function( done ) {
		// setup here
		done();
	},
	"no args": function( test ) {


		var nuage = new Nuage( config );
		nuage.start();
		test.expect( 1 );

		// tests here
		http.get( test, "/", function( res ) {
			test.done();
		});
	}
};
