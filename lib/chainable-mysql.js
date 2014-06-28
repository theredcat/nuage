var Memcached = require('memcached');
var log = require('ccms-log');
var mysql = require('mysql');


var Mysql = function(){};
var MysqlInstance = function(){};

MysqlInstance = function(name,read,write){

	if(this._read == false){
		this._write = write;
		this._read = read;
	}

	this.name = name;
	this.tmp = null;
	this.groupBy = [];
	this.parameters = [];
	this.sql = '';
	this._query_type = null;
	this._mainTable = '';
	this._joined = false;
	this._groupName = '';
	this._cacheHit = false;
}

MysqlInstance.prototype = {

	debug : false,
	_write : false,
	_read : false,

	cache: function(module,id,ttl){
		//TODO
		return this;
	},

	select: function(fields){

		if(this._cacheHit)
			return this;

		if(Array.isArray(fields)){
			this.tmp = fields;
		}else{
			this.tmp = [];
			for (var i = 0; i < arguments.length; i++) {
				this.tmp.push(arguments[i]);
			}

		}

		return this;
	},

	from: function(from){

		this._mainTable = from;
		this._query_type = 'select';
		
		var fields = this.tmp;
		var fieldList = [];
		
		for(var i=0; i<fields.length;i++){
			if(typeof(fields[i])=='string'){
				fieldList.push(from+'.'+fields[i]+' AS '+fields[i]);
			}else{
				if(fields[i].group){
					this._groupName = fields[i].groupName;
					var concat = [];
					for (var j = fields[i].columns.length - 1; j >= 0; j--) {
						if(typeof(fields[i].columns[j]) == 'string'){
							concat.push("'\""+fields[i].columns[j]+"\":\"',"+fields[i].columns[j]+",'\"'")
						}else{
							concat.push("'\""+fields[i].columns[j].col+"\":\"',"+fields[i].columns[j].table+'.'+fields[i].columns[j].col+",'\"'")
						}
					};
					fieldList.push("CONCAT('[',GROUP_CONCAT(CONCAT('{',"+concat.join(",',',")+",'}')),']') AS "+fields[i].groupName);
					this.groupBy.push(fields[i].group);
				}else{
					var tmp = '';
					
					if(fields[i].table)
						tmp += fields[i].table+'.'
						
					tmp += fields[i].col;
					
					if(fields[i].as)
						tmp += ' AS '+fields[i].as;
						
					fieldList.push(tmp);
				}
			}
		}
		
		this.sql = 'SELECT '+fieldList.join(', ')+' FROM '+from;

		return this;

	},

	group: function(group){
		if(this._cacheHit)
			return this;

		if(Array.isArray(group))
			group = group.join(',');

		if(this.groupBy.length > 0){
			group = group+','+this.groupBy.join(',');
			this.groupBy = [];
		}

		this.sql += " GROUP BY "+group;

		return this;
	},

	limit: function(start,length){

		if(this._cacheHit)
			return this;

		if(this.groupBy.length > 0){
			this.group(this.groupBy);
			this.groupBy = [];
		}
		
		this.sql += ' LIMIT '+start+','+length;

		return this;
	},

	update: function(table,columns){

		if(!columns){
			this.tmp = table;
			return this;
		}

		this._mainTable = table;
		this._query_type = 'update';
		
		var sets = [];
		this.sql = 'UPDATE '+table+' SET ';
		for(var i in columns){
			sets.push(i+' = ?');
			this.parameters.push(columns[i]);
		}
		this.sql += sets.join(', ');
		
		return this;
	},

	set: function(columns){
		return this.update(this.tmp,columns);
	},

	deleteFrom: function(table){
		this._mainTable = table;
		
		this._query_type = 'delete';
		
		this.sql = 'DELETE FROM '+table;
		return this;
	},

	insertIgnore: function(table,values){
		this._query_type = 'insert ignore';
		
		return this.insert(table,values);
	},

	insert: function(table,values){
	
		this._mainTable = table;
	
		if(!this._query_type || this._query_type != 'insert ignore')
			this._query_type = 'insert';
			
		var keys = Object.keys(values);
		var groups = [];
		var ignore = (this._query_type == 'insert ignore') ? 'IGNORE ' : '';

		this.sql = "INSERT "+ignore+"INTO "+table+"("+(keys.join(','))+") VALUES ";
		
		for(var i = 0; i<values[keys[0]].length; i++){
			var vals = [];
			for(var j = 0; j<keys.length; j++){
				this.parameters.push(values[keys[j]][i]);
				vals.push('?');
			}
			groups.push('('+vals.join(',')+')');
		}
		this.sql += groups.join(',');
		
		return this;
	},
	
	where: function(conditions){

		if(this._cacheHit)
			return this;

		this.sql += ' WHERE '+this._condition(conditions);
		
		return this;
	},
	
	join: function(table,conditions){
		if(this._cacheHit)
			return this;

		return this.innerJoin(table,conditions);
	},
	
	leftJoin: function(table,as,conditions){
		if(this._cacheHit)
			return this;

		if(!conditions){
			conditions = as
			as = '';
		}

		if(as && as != '')
			as = ' AS ' + as + ' '

		if(typeof(conditions) == 'string'){
			this.sql += ' LEFT JOIN '+table+as+' ON '+table+'.'+conditions+' = '+this._mainTable+'.'+conditions;
		}else{
			this.sql += ' LEFT JOIN '+table+as+' ON '+this._condition(conditions);
		}
		
		return this;
	},
	
	innerJoin: function(table,as,conditions){
		if(this._cacheHit)
			return this;

		if(!conditions){
			conditions = as
			as = '';
		}

		if(as && as != '')
			as = ' AS ' + as + ' '

		if(typeof(conditions) == 'string'){
			this.sql += ' INNER JOIN '+table+as+' ON '+table+'.'+conditions+' = '+this._mainTable+'.'+conditions;
		}else{
			this.sql += ' INNER JOIN '+table+as+' ON '+this._condition(conditions);
		}
		
		return this;
	},
	
	order: function(fields){
		if(arguments.length == 0){
			throw new Error('You must specify at least one column to SQL "order" function');
		}


		if(this._cacheHit)
			return this;

		if(arguments.length > 1){
			fields = [];
			for (var i = 0; i < arguments.length; i++) {
				fields.push(arguments[i]);
			}
		}else if(!Array.isArray(fields)){
			fields = [fields];
		}

		var tmp = [];

		for(var i = 0; i<fields.length; i++){
			if(typeof fields[i] != 'string'){
				if(!fields[i].direction)
					fields[i].direction = 'ASC';
				tmp.push(fields[i].col + ' ' + fields[i].direction);
			}else{
				tmp.push(fields[i]);
			}
		}

		this.sql += ' ORDER BY '+tmp.join(',');

		return this;
	},

	_condition: function(conditions){
		
		
		var condList = [];
		if(!(conditions instanceof Array)){
			conditions = [conditions];
		}
		for(var i = 0; i<conditions.length; i++){
			var orList = [];
			for(j in conditions[i]){
				if(typeof conditions[i][j] == 'string' || !isNaN(conditions[i][j])){
					orList.push(this._mainTable+'.'+j+' = ?');
					this.parameters.push(conditions[i][j]);
				}else if(conditions[i][j] instanceof Array){
					var tmp = [];
					for(k in conditions[i][j]){
						tmp.push('?') ;
						this.parameters.push(conditions[i][j][k]);
					}
					orList.push(j+' IN ('+tmp.join(',')+')');
				}else{
					var op = (conditions[i][j].op) ? conditions[i][j].op : '=';
					if(conditions[i][j].col){
						if(conditions[i][j].table)
							conditions[i][j].col = conditions[i][j].table+'.'+conditions[i][j].col;
						orList.push(j+' '+op+' '+conditions[i][j].col);
					}else if(conditions[i][j].val){
						orList.push(j+' '+op+' ?');
						this.parameters.push(conditions[i][j].val);
					}else{
						throw 'No column nor value in this SQL condition : '+conditions[i][j]+' @ '+this.sql;
					}
				}
			}
			condList.push('('+orList.join(' OR ')+')');
		}
		return condList.join(' AND ');
	},

	run: function(cb,errcallback){

		if(this._cacheHit){
			cb(this.cache);
		}

		if(this.groupBy.length > 0){
			this.group(this.groupBy);
			this.groupBy = [];
		}

		switch(this._query_type){
			case 'select':
				this._execread(cb,errcallback);
			break;

			case 'update':
			case 'delete':
			case 'insert':
			case 'insert ignore':
				this._execwrite(cb,errcallback);
			break;
			
			default:
				throw 'Unknow request type : '+this._query_type;
		}
	},
	
	_exec: function(handle,pool,callback,errcallback){
		var sqlRequest = this;

		if(this.debug){
			log.debug(mysql.format(sqlRequest.sql,sqlRequest.parameters));
		}

		handle.getConnection(function(err,connection){

			if(err){
				sqlRequest.tmp = null;
				sqlRequest.groupBy = [];
				sqlRequest._groupName = '';
				sqlRequest.parameters = [];
				sqlRequest.sql = '';
				sqlRequest._query_type = null;
				sqlRequest._mainTable;
				sqlRequest._joined = false;
				throw err;
			}else{
				connection.query(sqlRequest.sql,sqlRequest.parameters,function(err,data){
					connection.release();

					sqlRequest.tmp = null;
					sqlRequest.groupBy = [];
					sqlRequest.parameters = [];
					sqlRequest._query_type = null;
					sqlRequest._mainTable;
					sqlRequest._joined = false;

					if(err){
						if(errcallback)
							errcallback(err,sqlRequest);
						else
							throw err;
						sqlRequest.sql = '';
						sqlRequest._groupName = '';
					}else{
						sqlRequest.sql = '';
						if(sqlRequest._groupName != ''){
							for (var i = data.length - 1; i >= 0; i--) {
								data[i][sqlRequest._groupName] = JSON.parse(data[i][sqlRequest._groupName]);
							};
						}
						sqlRequest._groupName = '';
						callback(data);
					}
				});
			}
		});
	},
	
	_execread: function(callback,errcallback){
		this._exec(this._read,'read',callback,errcallback);
	},
	
	_execwrite: function(callback,errcallback){
		this._exec(this._write,'write',callback,errcallback);
	}
}

Mysql.prototype = {

	_instancesNames : [],
	_instances : {},
	_read : false,
	_write : false,

	instance: function(name){
		if(this._instancesNames.indexOf(name) == -1){
			log.debug('Spawning new MySQL instance : '+name);

			var tmp = new MysqlInstance(name,this._read,this._write);
			this._instances[name] = tmp;
			this._instancesNames.push(name)

			return tmp;
		}else{

			log.debug('Re-using MySQL instance : '+name)
			return this._instances[name];
		}
	},

	debug: function(flag){
		MysqlInstance.debug = flag;
	},

	load: function(conf){

		if(!conf.slave){
			throw new Error('No mysql slave (read only) server configured');
		}

		// Slaves en Round Robin pour la repartition de charge
		var dbRead = mysql.createPoolCluster({defaultSelector:'RR'});
		for(var i = 0; i<conf.slave.length; i++){
			log.debug('Adding MySQL slave server "'+ conf.slave[i].host + ((conf.slave[i].port) ? ':'+conf.slave[i].port : '') +'" with '+conf.poolSize+' connections');
			for(var j = 0; j<conf.poolSize; j++)
				dbRead.add(conf.slave[i]);
		}

		if(conf.master){
			// Master en failover. Toujours le premier noeud, sauf si il est offline
			var dbWrite = mysql.createPoolCluster({defaultSelector:'ORDER'});
			for(var i = 0; i<conf.master.length; i++){
				log.debug('Adding MySQL master server "'+ conf.master[i].host + ((conf.master[i].port) ? ':'+conf.master[i].port : '') +'" with '+conf.poolSize+' connections');
				for(var j = 0; j<conf.poolSize; j++)
					dbWrite.add(conf.master[i]);
			}
		}

		this._read = dbRead;
		this._write = dbWrite;

		return this;
	}
}

module.exports = exports = new Mysql();
