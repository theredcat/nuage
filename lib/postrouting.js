module.exports = function(originalRender){

	var render = originalRender;

	return function(view, options) {

		var self = this,
		options = options || {},
		req = this.req,
		app = req.app,
		defaultFn;
		
		if(!options.layout)
			options.layout = res.layout;

		if(res.headerData)
			options.header = res.headerData;

		options.section = req.section;

		options.lang = lang;

		options.token = req.csrfToken();

		options.user = {
			name: req.user.get('name'),
			firstname: req.user.get('firstname'),
			lastname: req.user.get('lastname'),
			logged: !req.user.isAnonymous(),
			prefix: req.user.get('prefix')
		};
		
		if(!options.styles)
			options.styles = [];
		if(!options.scripts)
			options.scripts = [];

		
		if(req.splittedUrl[1]=='admin'){
			var toolbar = [[]];
			options.scripts.push('admin');
			if(req.splittedUrl.length > 2 && req.splittedUrl[2] != 'index'){
				toolbar[0].push({text:'Retour a l\'administration',icon:'rewind',customClass:'backAdmin'});
				if(!(splittedUrl.length==4 && splittedUrl[3]=='index'))
					toolbar[0].push({text:'Retour',icon:'chevron-left',customClass:'back'});
			}

			options.toolbar = toolbar.concat(options.toolbar);
			options.styles.push('admin');
		}
		
		for(var i in options.scripts){
			if(!options.scripts[i].match(/^http:\/\//))
				options.scripts[i] = '/javascripts/'+options.scripts[i]+'.js';
		}

		req.user.lastPage(req.initialUrl);
		req.session.user = req.user.exportToArray();

		if(options.title && req.sectionName)
			options.title = app.conf.site.title + ' / ' + req.sectionName + ' / ' + options.title.join(' / ');
		if(options.layout == 'ajax'){
			options.layout = false;
			fn = function(err, str){
				if (err) return req.next(err);
				res.setHeader('Content-Type', 'application/json');
				self.send(JSON.stringify({h:str,d:options.data}));
			};
		}else if(options.layout == 'json'){
			options.layout = false;
			fn = function(err, str){
				if (err) return req.next(err);
				res.setHeader('Content-Type', 'application/json');
				self.send(JSON.stringify(options.data));
			};
		}else{
			fn = function(err, str){
				if (err) return req.next(err);
				self.send(str);
			};
		}

		render.call(self, view, options, function(err, str) {
			fn(err, str);
		});
	};
};