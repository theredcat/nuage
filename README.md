# Features #
  * Render based on the url extension
  
# Module Api #
## Module example ##
```javascript
exports.init = function(app, conf){
	var routeIndex = function(req,res){
		res.render('index/index', {
			// Title is the only required attribute as it's used by the core
			title: ['Owned']
		});
	}

	var routeFormPost = function(req,res){
		res.render('myModule/myView', {
			title: ['Owned']
			// You can add as many attribute as you want and use them in the views
			// There is few reserved words, like "title" (see "Views")
			catAdjectives:["Big","Fat","Black and white","Mustached","Crazy"],
			catName:"Panda"
		});
	}

	var routeAnotherFormPost = function(req,res){
		// req.body contain every post-passed parameters
		if(req.body.myFormField){
			res.render('core/message', {
				title: ['Owned'],
				messageHead: 'Owned',
				message: 'That\'s a lot of cats!',
				messageType: 'success',
				data: {cat:42*1337}
			});
		}else{
			res.render('core/message', {
				title: ['Owned'],
				messageHead: 'Owned',
				message: 'Yolo',
				messageType: 'success',
			});
		}
	}

	// If you need it, you can define match group to handle URLs. They name must contain only letters and numbers ([a-zA-Z0-9])
	// They name must start with the module name to avoid conflicts between modules
	// Few of them are already defined in the core (see "URLs matching")
	app.addParam('myModuleSpecialMatchGroup', /^\d+$/);
	var routeAdminDashboard = function(req,res){
		res.render('myModule/myView', {
			title: ['Owned']
			catAdjectives:["Big","Fat","Black and white","Mustached","Crazy"],
			catName:"Panda"
		});
	}
	
	this.urls = {
		get : {
			// In CCMS / and /index are equivalents
			'/index' : routeIndex,
			'/admin/awesome/dashboard-:myModuleSpecialMatchGroup' : routeAdminDashboard // We're using the match group defined few line above
		},
		post : {
			// Multiple routes can use same handler
			'/myform' : routeFormPost,
			'/another/form' : routeFormPost
		}
	};
	
	// Defining which ACL should be checked when an user access an URL.
	// The URL syntax in ACL is the same as the url syntax in routing
	this.acl = {
		// Those 3 ACL are the basics ACL
		admin : {
			get : [
				'/admin/awesome/dashboard-:myModuleSpecialMatchGroup',
			]
		},
		public:{
			get : [
				'/index'
			]
		},
		logged:{
			post:[
				'/myform',
			]
		},
		// But you can define any custom ACL
		myCustomAcl:{
			post:[
				'/another/form'
			]
		}
	}
	
	// Facultative : This export a button to the admin pannel
	this.admin = {
		url: '/admin/utilisateurs/index',
		icon: 'user',
		legend: 'Utilisateurs'
	}
	
	return this;
};
```

## URLs extensions ##
The URL system allow you to have a single route ("/myUrl" for example) defined in your module and be able to render it in 3 different ways
### /myUrl or /myUrl.html ###
Meh. Nothing fancy here : full HTML with header, footer, menus, etc...
### /myUrl.ajax ###
Render only the page body (not the &lt;body&gt;, but your page body) and answer with a json that look like this : 

```javascript
{
	"h" : "<div>My page</div>",
	"d" : {
		"var1":3,
		"var2":"yolo"
	}
}
```

The "h" section of the json contain the rendered view for this URL. Unlike ".html" thoses answers doesn't include the full HTML with header, footer, etc. It just contain the rendered view

The "d" section contains is optional and contain some javascript data that you can pass to the view using the "data" attribute. You dont need to decode it, the core will parse the json for you.
This allow you to easily make ajax request and get data AND html with the server with one simple request.

Example :
**Server side**
```javascript
	res.render('mymodule/myview', {
		title: ['Owned'],
		data: {cats:1337}
	});
```

**Client side**
_(Note : this example use jquery, but that's obviously not required)_
```javascript
$.get('/myUrl.ajax',function(serverResponse){
	$('#myDiv').html(serverResponse.h);
	alert(serverResponse.d.cats);
},'json');
```

### /myUrl.json ###
Answers to thoses URLs are intended to retreive raw data from the server. It just return the value passed to the "data" attribute when rendering a view.

This is similar to ".ajax" url except you don't get the HTML: 
**Server side**
```javascript
	res.render('mymodule/myview', {
		title: ['Owned'],
		data: {cats:1337}
	});
```

**Client side**
_(Note : this example use jquery, but that's obviously not required)_
```javascript
$.get('/myUrl.ajax',function(serverResponse){
	alert(serverResponse.cats);
},'json');
```

## URLs matching ##
### URL/Handler matching ###
You match an url and his handler via the `urls` attribute of you module : 
```javascript
this.urls = {
	get : {
		'/index' : routeIndex
	},
	post : {
		'/another/form' : routeFormPost
	}
};
```
### Match groups ###
#### Definition ####
These are fixed urls, but you may want to put parameters in it. To do so, you must use a predefined matchgroup, or create your own.
The core matchgroups are :

  * id : `\d+`
  * uuid : `[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}`
  * page : `\d+`
  * alphaid : `[a-zA-Z0-9-]+`
  * name : `.+`

To define your own matchgroup, you can do this : 
```javascript
app.addParam('myModuleSpecialMatchGroup', /^\d+$/);
```
The start and end markers are mandatory. You musn't do this :
```javascript
app.addParam('myModuleSpecialMatchGroup', /\d+/);
```

#### Usage ####
```javascript
this.urls = {
	get : {
		// This will match the url starting with "/index" and followed with one ore more numbers
		'/index:myModuleSpecialMatchGroup' : routeIndex 
	}
};
```

## Request handlers ##
### Definition ###
The handler


## Users ##
The core User api doesn't depend on the user module which provide personal profile page and admin capabilities
### Current user ###
The request object you get in URLs handlers contain a "user" attribute. This attribute contain an object which allow you to make some test and retreive proprieties of the User for the current request.

_**Note** : parameters in italic are facultative_

|Method|Parameters|Return Value|Note|
|:-----|:---------|:-----------|:---|
|loadFromArray|Hash|A loaded user|This shouldn't be used since the User must be loaded via a `var user = new User(id)`|
|filter|_Username_|A filtered username.|As source, it use either the provided username, or the current username|
|exportToArray||All user properties|Shouldn't be used. Use the `get` function to retreive the user properties|
|getProperties||All user properties|An alias for exportToArray|
|isAnonymous||Boolean||
|login|Email, Password, Callback(User)||Log the user in. `False` will be passed to the callback instead of an user if the login wasn't successful|
|validate|Token|Callback(Boolean)||Valide the user. The callback will receive True if the activation was successful|
|isValid||Boolean|True is the user account as been validated, false Otherwise|
|load|Uid,Callback(User)||Load an user from the database. The loaded user will be passer as callback parameter or false if the user doesn't exists|
|can|Acl,_Acl_,_Acl_,...,Callback||The acl format is {module:'moduleName',name:'myAcl'}. If one of the Acl match, a True will be passed to the callback, False otherwise. The last parameter is the callback function|
|hasGroup|Group Id or Group Name|Boolean|Return True if the user is in this group, False otherwise. You can use group id or group name|
|hash|Password|base64 SHA512 string |Hash the provided password|
|set|Attribute name,NewValue,Callback(User)||Set an attribute or change it's value|
|get|Attribute name|Attribute Value||
|addToGroup|Groups,Callback()||Add the user to a group an reload the user|
|changePassword|oldPassword,newPassword,Callback(User)||Change the user password if the current password is valid|
|lastPage|_Page_|Last URL|Get or set the last seen URL|
|delete|callback||Remove the user|