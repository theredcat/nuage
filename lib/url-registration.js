var log = require('ccms-log');

exports.load = function(app){
	return function(urls){
		if(typeof(urls.get)!="undefined"){
			for(var url in urls.get){
				var handler = urls.get[url];
				if(typeof(handler)!='undefined'){
					if(app.registeredRoutes.get.indexOf(url)==-1){
						log.debug('  Registering GET  url "'+url+'"');
						app.registeredRoutes.get.push(url);
						app.get(url,handler);
					}else{
						var msg = 'Cant register GET url : '+url+' (route already registered)'
						log.error(msg);
					}
				}else{
					msg = 'Cant register GET url : '+url+' (undefined handler)';
					log.error(msg);
				}
			}
		}

		if(typeof(urls.post)!="undefined"){
			for(var url in urls.post){
				var handler = urls.post[url];
				if(typeof(handler)!='undefined'){
					if(app.registeredRoutes.post.indexOf(url)==-1){
						log.debug('  Registering POST  url "'+url+'"');
						app.registeredRoutes.post.push(url);
						app.post(url,handler);
					}else{
						var msg = 'Cant register POST url : '+url+' (route already registered)'
						log.error(msg);
					}
				}else{
					msg = 'Cant register POST url : '+url+' (undefined handler)';
					log.error(msg);
				}
			}
		}
	};
};