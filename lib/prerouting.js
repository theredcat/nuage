var db = require('../lib/chainable-mysql');
var log = require('ccms-log');
var path = require('path');
var uuid = require('uuid');
var Mysql = require(path.join(__dirname,'user'));

exports.load = function(app){
	return function(req, res, next){

		res.render = require(path.join(__dirname, 'postrouting'))(res.render);

		req.id = uuid.v1();
		req.initialUrl = req.url;
		req.url = req.url.split('?')[0];
		
		var lastUrlPart = req.url.split('/').pop();
		
		if(lastUrlPart == ''){
			req.url += 'index.html';
		}else if(lastUrlPart.indexOf('.') == -1){
			req.url += '.html';
		}
		
		if(req.url.slice(-5)=='.ajax'){
			res.layout = 'ajax';
			req.url = req.url.substring(0, req.url.length - 5);
		}else if(req.url.slice(-5)=='.json'){
			res.layout = 'json';
			req.url = req.url.substring(0, req.url.length - 5);
		}else if(req.url.slice(-5)=='.html'){
			res.layout = 'layout';
			res.headerData = {
				topbar: app.topbar
			}
			req.url = req.url.substring(0, req.url.length - 5);
		}
		
		splittedUrl = req.url.split('/');
		splittedUrl.shift();
		req.splittedUrl = splittedUrl;
		
		var proccess = function(user){

			req.user = user;
			req.user.can({module:"admin",page:"index"},function(isAdmin){


				if(app.sectionsList.indexOf(splittedUrl[0])!=-1 || splittedUrl[0] == 'site'){
					var newUrl = [];
					req.url = "";
					req.sectionName = app.sections[splittedUrl[0]];
					req.section = splittedUrl[0];
					for(var i=1;splittedUrl.length>i; i++){
						req.url += "/"+splittedUrl[i];
					}
					next();
				}else if(splittedUrl[0] != 'stylesheets' && splittedUrl[0] != 'javascripts' && splittedUrl[0] != 'fonts' && splittedUrl[0] != 'content' && splittedUrl[0] != 'images'){
					if(!app.defaultRedirect){
						log.debug('302 : '+req.url+' /'+app.conf.site.defaultSection+req.url);
						res.redirect(302, '/'+app.conf.site.defaultSection+req.url);
						req.sectionName = app.sections[splittedUrl[0]];
						req.section = app.conf.site.defaultSection;
					}else{
						app.defaultRedirect(req, res);
					}
				}else{
					next();
				}
			});
		}
		
		if(!req.session)
			req.session = {};
		
		if(!req.session.user){
			var user = new User();
			user.load(0,proccess);
		}else{
			var user = new User();
			proccess(user.loadFromArray(req.session.user));
		}
		
	}
}