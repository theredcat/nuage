/*
 * nuage
 * https://github.com/theredcat/nuage
 *
 * Copyright (c) 2016 Nathan DELHAYE
 * Licensed under the GPLv2 license.
 */
"use strict";

// TODO : Clean this mess and use import when ES6 is there
var traceur = require( "traceur" );
traceur.require.makeDefault(function( filename ) {
        return filename.indexOf( "node_modules" ) === -1;
});

var Nuage = require("../lib/nuage.js").Nuage;

var env = process.env.NODE_ENV ? process.env.NODE_ENV : "dev";
var config = require( "../config." + env + ".json");

var app = new Nuage( config );
app.start();

