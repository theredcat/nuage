'use strict';

var traceur = require('traceur');
 
traceur.require.makeDefault(function(filename) {
	return filename.indexOf('node_modules') === -1;
});
 

var Nuage = require('../lib/nuage.js').Nuage;

module.exports = {
	setUp: function(done) {
		// setup here
		done();
	},
	'no args': function(test) {
		var nuage = new Nuage(require('../config.dev.json'));
		test.expect(1);

		// tests here
		test.equal(nuage.start(),true);

		test.done();
	},
};
