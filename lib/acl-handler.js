module.exports = function(aclObject){
	var routeAcl = aclObject;
	var handler = function(req,res,next){
		log.debug('URL : '+req.url,routeAcl);
		req.user.can(routeAcl,function(authorized){
			if(authorized){
				log.debug('URL : ACL OK');
				next();
			}else{
				log.debug('URL : ACL Not OK');
				if(!req.user.isValid()){
					log.debug('User not validated '+req.user.get('email'))
					res.render('user/notValid');
				}else{
					res.render('core/unauthorised');
				}
			}
		})
	};
	return handler;
};