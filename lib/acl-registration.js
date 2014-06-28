var log = require('ccms-log');

exports.load = function(app){
	return function(module, acl){

		for(var aclName in acl){

			var list = acl[aclName];

			log.debug('Registering ACL "'+aclName+'" for module "'+module+'"');
			if(typeof(list.get)!="undefined"){
				for(var i in list.get){

					var url = list.get[i].toString();

					if(app.registeredAcls.get.indexOf(url)==-1){
						log.debug('  Adding GET url "'+url+'" to acl "'+module+'/'+aclName+'"');
						
						var aclTuple = {'module':module,'name':aclName};

						app.registeredAcls.get[url] = aclTuple;
						app.get(url,app.aclHandler(aclTuple));
					}else{
						log.error('  Cant register GET ACL : '+url+' (ACL already registered)');
					}
				}
			}
			if(typeof(list.post)!="undefined"){
				for(var i in list.post){

					var url = list.post[i].toString();

					if(app.registeredAcls.post.indexOf(url)==-1){
						log.debug('  Adding POST url "'+url+'" to acl "'+module+'/'+aclName+'"');

						var aclTuple = {'module':module,'name':aclName};
						var handler = app.aclHandler(aclTuple);

						app.registeredAcls.post[url] = aclTuple;
						app.post(url,handler);
					}else{
						log.error('  Cant register POST ACL : '+url+' (ACL already registered)');
					}
				}
			}
		}
	}
}