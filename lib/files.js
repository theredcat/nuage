var file = require('fs');

var Files = module.exports = function(){}

Files.prototype = {
	readDir: function(dir, callback){
		file.readDir(__dirname'/'+dir.replace('..',''),callback);
	},
	writeFile: function(file,content, options, callback){
		fs.writeFile(file, content, options, callback);
	}
	readFile: function(file, options, callback){
		fs.readFile(file, content, options, callback);
	}
}
