/**
 * Profiling
 */
require('look').start();

/**
 * Module dependencies.
 */

var Express = require('express');
var params = require('express-params');
var http = require('http');
var path = require('path');
var array = require('array-extended');
var Fs = require('fs');
var Os = require('os');
var Log = require('ccms-log');
var Utils = require('ccms-utils');
var Mail = require('ccms-mail');
var MemcachedStore = require('connect-memcached')(Express);
var Events = require('events');

var I = require(path.join(__dirname,'translation')).I;
var lang = require(path.join(__dirname,'translation')).lang;
var User = require('./user');

var app = Express();

app.registeredRoutes = {get:[],post:[]};
app.registeredAcls = {get:[],post:[]};
app.adminModules = [];
app.modules = {};

// Events for modules
app.event = new Events.EventEmitter();

// Configs
if (typeof(app.get('env')) != 'undefined') {
	app.conf = require(path.join(__dirname,'config-'+app.get('env')+'.json'));
}else{
	app.conf = require(path.join(__dirname,'config.json'));
}

var log = Log.load(app.conf.log);
log.debug('First printable message');
log.debug('Configuration '+path.join(__dirname,'config-'+app.get('env')+'.json')+' loaded');
log.debug('Log configuration loaded');


log.debug('Applying sessions configuration');
app.use(Express.cookieParser());
app.use(Express.session({
	secret: app.get('sessions.secret'),
	store: new MemcachedStore(app.conf.sessions.memcache),
	cookie: { maxAge: 1000*app.conf.sessions.ttl }
}));

log.debug('Setting http logger');
app.use(Express.logger({
	format: app.conf.log.format,
	stream: log.stream()
}));


log.debug('Setting view directory');
app.set('views', __dirname + '/views');


log.debug('Using Mustache view engine');
app.set('view engine', 'mmm');


log.debug('Using trust proxy for reverse proxy');
app.enable('trust proxy')


log.debug('Using body parser');
app.use(Express.bodyParser({ 
	limit: app.conf.site.maxUploadSize
}));


if(app.conf.site && app.conf.site.gzip){
	log.debug('Using gzip');
	app.use(Express.compress());
}


log.debug('Removing x-powered-by header');
app.disable('x-powered-by');


log.debug('Using CRSF protection');
app.use(Express.csrf());


log.debug('Registering security filter');
app.use(function(req,res,next){
	if(typeof(req.host) == 'undefined'){
		log.warn('403! : '+req.ip+' // No host set');
		res.status(403).send('403 error : Forbidden request!');
	}else{
		next();
	}
})


log.debug('Registering security hook');
app.use(function (err, req, res, next) {
	if (err.status == 403){

		res.status(403).send('403 error : Forbidden request!');

		if ('GET' != req.method && 'HEAD' != req.method && 'OPTIONS' != req.method && !req.body._csrf)
			log.warn("403! : "+req.ip+" // CSRF ");
		else
			log.warn("403! : "+req.ip+" // Headers : ",req.headers,' // Body',req.body,' ');

	}else if (err.status == 404){
		log.notice("404 "+req.url+" "+req.get('referer'));
		res.render('core/404', { status: 404, success: false });
	}else{
		log.notice("500 "+req.url+" "+req.get('referer')+" "+err.message);
		res.render('core/500', { status: 500, success: false });
	}
});


log.debug('Using less parser in directory : '+path.join(__dirname, 'public'));
app.use(require('less-middleware')({
	force: app.conf.system.debug.assets,
	once: !app.conf.system.debug.assets,
	debug: app.conf.system.debug.assets,
	compress: !app.conf.system.debug.assets,
	yuicompress: !app.conf.system.debug.assets,
	optimization:2,
	src: path.join(__dirname, 'public')
}));


log.debug('Adding ttl header for statics : '+app.conf.system.performances.staticTtl+' seconds');
app.use(function (req, res, next) {
	res.setHeader('Cache-Control', 's-maxage='+app.conf.system.performances.staticTtl);
	next();
});


log.debug('Using static path : '+path.join(__dirname, 'public'));
app.use(Express.static(path.join(__dirname, 'public')));


log.debug('Removing default cache-control header');
app.use(function (req, res, next) {
	res.removeHeader('cache-control');
	next();
});


log.debug('Adding Access-Control-Allow-Origin header for fonts');
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', app.conf.system.security.allowRessourcesFrom);
	next();
});


log.debug('Using favicon : '+path.join(__dirname, 'public','images','favicon.png'));
app.use(Express.favicon(path.join(__dirname, 'public','images','favicon.png')));


log.debug('Setting translation variable');
app.I = I;


log.debug('Loading utils');
Utils.load(require(path.join(__dirname,'translation')).lang);


log.debug('Loading ACL handler');
app.aclHandler = require(path.join(__dirname,'lib','acl-handler'));


log.debug('Setting url patterns');
params.extend(app);
app.param('id', /^\d+$/);
app.param('uuid', /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
app.param('page', /^\d+$/);
app.param('alphaid', /^[a-zA-Z0-9-]+$/);
app.param('name', /^.+$/);


log.debug('Setting app basedir');
app.basedir = __dirname;

log.debug('Loading url registration lib');
var registerUrls = require(path.join(__dirname,'lib','url-registration')).load(app);


log.debug('Loading acl registration lib');
var registerAcl = require(path.join(__dirname,'lib','acl-registration')).load(app);


log.debug('Recovering topbar infos');
db.instance('system').select('value').from('system').where({key:'topbar'}).run(function(data){
	

	log.debug('Parsing topbar info');
	try{
		data = JSON.parse(data[0].value);
	}catch(e){
		log.error('Cannot parse topbar info : ' + e.message);
		process.exit(128);
	}
	
	data.sort(function(a, b) {return a.position - b.position});
	for(var i = 0; i<data; i++){
		if(data[i].submenu){
			data[i] = data[i].sort(function(a, b) {return a.position - b.position});
		}
	}

	app.topbar = data;

	log.debug('Recovering user props infos');
	db.instance('system').select('propId', 'propName').from('userPropsName').run(function(data){
		app.userPropsId = {};
		app.userPropsName = {};
		for(var i = 0; i < data.length; i++){
			app.userPropsId[data[i].propName] = data[i].propId;
			app.userPropsName[data[i].propId] = data[i].propName;
		}

		log.debug('Recovering sections infos');
		db.instance('system').select('section','name').from('sections').run(function(data){
			app.sectionsList = [];
			app.sections = {};

			for(var i = 0; i < data.length; i++){
				app.sectionsList.push(data[i].section);
				app.sections[data[i].section] = data[i].name
			}


			log.debug("Registering prerouting and postrouting hook");
			app.all('*', require(path.join(__dirname,'lib','prerouting')).load(app));

			var modulesList = [];

			log.info("Discovering modules from config")
			for(var module in app.conf.modules){
				
				modulesList.push(module);

				log.info("Loading module " + module);
				var tmp = require('./modules/'+module);

				if(typeof(tmp.init)=='function'){
					if(app.conf.modules[module] == null )
						tmp = tmp.init(app);
					else
						tmp = tmp.init(app,app.conf.modules[module]);
				}
					
				if(tmp.admin){
					log.debug("Found an admin pannel hook to register " + tmp.admin.url);
					app.adminModules.push(tmp.admin);
				}
				
				if(tmp.acl){
					log.debug("Found some acl for module " + module);
					registerAcl(module,tmp.acl);
				}
				
				if(tmp.urls){
					log.debug("Found some urls for module " + module);
					registerUrls(tmp.urls);
				}

				app.modules[module] = tmp;
			}

			log.debug('Setting url pattern "module" with module list');
			var matchModule =  new RegExp("^"+modulesList.join('|')+"$", "i");
			app.param('module',matchModule);

			for(var i in app.registeredRoutes.get){
				if(typeof app.registeredAcls.get[app.registeredRoutes.get[i]] == 'undefined')
					log.error('Not protected GET route : '+(app.registeredRoutes.get[i]));
			}

			for(var i in app.registeredRoutes.post){
				if(typeof app.registeredAcls.post[app.registeredRoutes.post[i]] == 'undefined')
					log.error('Not protected POST route : '+(app.registeredRoutes.post[i]));
			}


			if(app.conf.system.debug.assets)
				log.error('Debug mode for assets activated (YOU MUSN\'T DO THAT IN PRODUCTION ENV)');


			log.debug("I'm the host : "+Os.hostname());

			if(!app.conf.system.nodes[Os.hostname()] || app.conf.system.nodes[Os.hostname()].length == 0){
				log.error('There is no configured ports for host ' + Os.hostname());
				process.exit(129);
			}

			app.set('port', app.conf.system.nodes[Os.hostname()][0] || 80);
			
			log.info("Listening on 0.0.0.0:"+app.get('port'));
			app.listen(app.get("port"));
			
			if(app.conf.system && app.conf.system.security && app.conf.system.security.user)
				process.setgid(app.conf.system.security.user);

			if(app.conf.system && app.conf.system.security && app.conf.system.security.group)
				process.setuid(app.conf.system.security.group);
		});
	});

});