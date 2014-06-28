var DateFormat = require('dateformat');

var Utils = function(){};

Utils.prototype = {
	_translation : false,

	load : function(translation){
		if(!this._translation){
			this._translation = translation;
		}
	},
	formatTime : function(timestamp){
		if(!this._translation)
			return timestamp;
		return DateFormat(timestamp*1000, this._translation._timeFormat);
	},
	formatDate : function(timestamp){
		if(!this._translation)
			return timestamp;
		return DateFormat(timestamp*1000, this._translation._dateFormat);
	},
	formatTimeDate : function(timestamp){
		if(!this._translation)
			return timestamp;
		return DateFormat(timestamp*1000, this._translation._dateTimeFormat);
	},

	formatAnd : function(list){
		if(!Array.isArray(list))
			throw("")
		var lastElement = list.pop();
		this._translation.I('and')
		return 
	}
}

module.exports = exports = new Utils();