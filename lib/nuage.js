/*
 * nuage
 * https://github.com/theredcat/nuage
 *
 * Copyright (c) 2016 Nathan DELHAYE
 * Licensed under the GPLv2 license.
 */

"use strict";

var http = require( "http" );
var ecstatic = require( "ecstatic" );

export class Nuage {
	constructor( config ) {
		this.config = config;
		this.httpServer = http.createServer(
			 ecstatic({
				root: config.http.root,
				baseDir: "/",
				showDir: false,
				showDotfiles: false,
				autoIndex: false,
				gzip: config.http.gzip,
				serverHeader: false
			})
		);
	}
	start() {
		this.httpServer.listen( this.config.http.port );
		return true;
	}
}

