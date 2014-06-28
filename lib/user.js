Crypt = require('crypto');
Diacritics = require('diacritics').remove;
I = require('./translation').I;

var User = module.exports = function(){
	this.data = {};
}

User.prototype = {
	loadFromArray: function(data){
		this.data = data;
		return this;
	},
	filter: function(userName){
		if(!userName)
			var userName = this.get('userName');
		return Diacritics(userName).replace(/[ ']/g, '-').toLowerCase().replace(/[^a-z0-9-]/g,'');
	},
	getProperties: function(){
		return this.data;
	},
	exportToArray: function(){
		return this.data;
	},
	isAnonymous: function(){
		return (this.data.type == 'anonymous');
	},
	login: function(email,password,callback){
		var user = this;
		this._db.select(['userId']).from('users').where([{userPassword:Crypt.createHash('sha512').update(password).digest('hex')},{userEmail:email}]).run(function(rows){
			if(rows.length != 1){
				callback(false);
			}else{
				user.load(rows[0].userId,callback);
			}
		});
	},
	validate: function(token,callback){
		
		if(token==this.get('token')){
			this.data.valid = true;
			this._db.update('users',{userValid:[true]}).where({userId:this.get('id')}).run(function(){
				callback(true);
			});
		}else{
			callback(false);
		}
	},
	isValid: function(){
		if(this.get('valid')){
			return true;
		}else{
			return false;
		}
	},
	load: function(uid,callback){
		
		var user = this, selectArray = [], dbRequest;
		
		selectArray.push('userId');
		selectArray.push('userName');
		selectArray.push('userEmail');
		selectArray.push('userRegistration');
		selectArray.push('userType');
		selectArray.push('userPassword');
		selectArray.push('userValid');
		selectArray.push({table:'groups',col:'groupId'});
		selectArray.push({table:'groups',col:'groupName'});
		
		dbRequest = this._db.select(selectArray).from('users').innerJoin('usersGroups','userId').innerJoin('groups',{'groups.groupId':{col:'usersGroups.groupId'}});

		if(uid == 0){
			dbRequest = dbRequest.where({userType:'anonymous'});
		}else{
			dbRequest = dbRequest.where({userId:uid});
		}

		dbRequest.run(function(rows){

			if(rows.length > 0){
				user.data.id = rows[0].userId;
				user.data.name = rows[0].userName;
				user.data.email = rows[0].userEmail;
				user.data.type = rows[0].userType;
				user.data.valid = rows[0].userValid;
				user.data.registration = rows[0].userRegistration;
				user.data.groups = [];
				user.data.acl = [];
				var groupsId = [];
				
				for(i in rows){
					user.data.groups.push({name:rows[i]['groupName'],id:rows[i]['groupId']});
					groupsId.push(rows[i]['groupId']);
				}
				
				user._db.select(['propValue','propId',{table:'userPropsName',col:'propName'}]).from('userProps').innerJoin('userPropsName','propId').where({userId:user.get('id')}).run(function(rows){

					for(i in rows){
						user.data[rows[i].propName] = rows[i].propValue;
					}

					user._db.select(['groupId','aclModule','aclType']).from('groupsAcl').where({groupId:groupsId}).run(function(rows){
						user.data.acl = rows;
						callback(user);
					});
				});
			}else{
				this.data = {};
				callback(false);
			}
		});
	},
	can: function(){
		var args = Array.prototype.slice.call(arguments);
		var callback = args.pop();


		if(!this.get('valid')){
			for(var j = 0; j < args.length; j++){
				var acl = args[j];
				if(acl.name == "public"){
					callback(true);
					return;
				}
			}
			callback(false);
			return;
		}

		for(var j = 0; j < args.length; j++){
			var acl = args[j];
			if(
				acl.name == "public" || 
				this.data.type == "root" || 
				(acl.name == "logged" && this.data.type != "anonymous")
			){
				callback(true);
				return;
			}

			for(i in this.data.acl){
				var userAcl = this.data.acl[i];
				if(
					(acl.module == userAcl.aclModule && acl.name == userAcl.aclType) || 
					(userAcl.aclModule == '*' && acl.name == userAcl.aclType) ||
					(userAcl.aclType == '*' && acl.module == userAcl.aclModule) ||
					(userAcl.aclType == '*' && userAcl.aclModule == '*')
				){
					callback(true);
					return;
				}
			}
		}
		callback(false);
	},
	hasGroup: function(group){
		var propToCompare;
		if(parseInt(group)==group){
			propToCompare = 'id';
		}else{
			propToCompare = 'name';
		}
		for(var i = 0; i < this.data.groups.length; i++){
			if(this.data.groups[i][propToCompare] == group)
				return true;
		}
		return false;
	},
	hash: function(str){
		return Crypt.createHash('sha512').update(str).digest('hex');
	},
	set: function(attr,value,callback){

		if(attr == 'id'){
			callback(this);
			return this;
		}

		var self = this;

		if(typeof this.get(attr) != 'undefined'){
			this.data[attr] = value;
			this._db.update('userProps').set({propValue:value}).where([{userId:this.get('id')},{propId:this.propsId[attr]}]).run(function(){
				if(callback)
					callback(this);
			});
		}else{
			if(this.propsId[attr]){
				this.data[attr] = value;
				this._db.insertIgnore('userProps',{userId:[self.get('id')],propId:[this.propsId[attr]],propValue:[value]}).run(function(){
					if(callback)
						callback(this);
				});
			}else{
				throw 'Trying to set unknow user propriety "'+attr+'" ';
			}
		}
		return this;
	},
	get: function(attr){
		switch(attr){
			case 'prefix' : return (this.data.sex=='male') ? I('Mr') : I('Mrs') ; break;
			default : return this.data[attr];
		}
	},
	addToGroup: function(groups,callback){
		var groupId = [], userId = [];

		if(!(groups instanceof Array)){
			groups = [groups];
		}

		for(var i = 0; i < groups.length; i++){
			groupId.push(group[i]);
			userId.push(this.get('id'));
		}


		this._db.insertIgnore('usersGroups',{groupId:groupId,userId:userId}).run(function(){
			self.load(self.get('id'),callback);
		});
	},
	changePassword: function(oldPassword,newPassword,callback){
		if(!this.get('id') || this.isAnonymous()){
			callback(this);
			return false;
		}

		var user = this;

		this._db.update('users')
		.set({userPassword:this.hash(newPassword)})
		.where([{userId:this.get('id')},{userPassword:this.hash(oldPassword)}]).run(function(){
			callback(user);
		});
	},
	lastPage: function(page){
		if(page)
			this.data.lastPage = page;
		else
			return this.data.lastPage;
	},
	delete: function(callback){
		this._db.deleteFrom('userProps').where({userId:this.get('id')}).run(function(){
			this._db.deleteFrom('usersGroups').where({userId:this.get('id')}).run(function(){
				this._db.deleteFrom('users').where({userId:this.get('id')}).run(function(){
					callback();
				});
			});
		});
	}
}
