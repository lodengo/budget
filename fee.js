var async = require('async');
var _ = require('underscore');
var math = require('./math');
var TopoSort = require("./topsort");
var db = require("./db");

var refReg = new RegExp([ 'f', 'c', 'cf', 'cc', 'ccf', 'cs', 'csf', 'cas' ]
.join('\\([^\\)]*\\)|')
+ '\\([^\\)]*\\)', 'g');

var Fee = module.exports = function Fee(_data) {
	this._data = _data;
}

Object.defineProperty(Fee.prototype, 'file', {
	get : function() {
		return this._data.file;
	}
});

Object.defineProperty(Fee.prototype, 'costId', {
	get : function() {
		return this._data.costId;
	}
});

Object.defineProperty(Fee.prototype, 'costType', {
	get : function() {
		return this._data.costType;
	}
});

Object.defineProperty(Fee.prototype, 'id', {
	get : function() {
		return this._data.id;
	}
});

Object.defineProperty(Fee.prototype, 'feeName', {
	get : function() {
		return this._data.feeName;
	}
});

Object.defineProperty(Fee.prototype, 'feeExpr', {
	get : function() {
		return this._data.feeExpr+"";
	}
});

Object.defineProperty(Fee.prototype, 'feeResult', {
	get : function() {
		return this._data.feeResult;
	},
	set: function (result) {
		this._data.feeResult = result;
	}
});
///////////////////////////////////////////////////////////
Fee.create = function(file, data, costData, parentId, callback) {
	db.createFee(file, data, costData, parentId, callback);
};

Fee.prototype.update = function(prop, value, callback) {
	var me = this;
	var id = me.id;
	var file = me.file;
	var hasProp = me._data.hasOwnProperty(property);
	var valueNotNull = (value !== undefined) && (value !== null);

	if (hasProp && value == me._data[prop]) {
		return callback(null, 0);
	} else {
		if (hasProp && !valueNotNull) { 
			db.deleteFeeProperty(file, id, prop, callback);
		} else if (valueNotNull) { 
			if ((!hasProp) || (value != me._data[prop])) {
				db.setFeeProperty(file, id, prop, value, callback);
			}
		}
	}
};

Fee.prototype.del = function(callback) {
	var me = this;
	var id = me.id;
	var file = me.file;
	db.deleteFee(file, id, callback);
};

Fee.get = function(file, id, callback) {
	db.getFee(file, id, function(err, nfee) {
		nfee.file = file;
		callback(err, new Fee(nfee))
	});
};
//////////////////////////////////////////////////////////////////
Fee.prototype.createRefTo = function(toIds, callback) {
	var me = this; 
	if(toIds.length == 0){
		return callback(null);
	}
	db.createRefsTo(me._data, toIds, callback);
};

Fee.prototype.removeRefsTo = function(toIds, callback) {
	var me = this; 
	if(toIds.length == 0){
		return callback(null);
	}
	db.removeRefsTo(me._data, toIds, callback);
};

Fee.prototype.refedToIds = function(callback) {
	var me = this;	
	db.feeRefedToIds(me._data, callback);
};

Fee.prototype.buildRef = function(callback) {
	var me = this;
	me.refedToIds(function(err, refedToIds) {
		me.refToIdsByExpr(function(err, refToIdsByExpr){	
			//console.log(['ref', me.costType, me.feeName, refedToIds, refToIdsByExpr]);			
			me.removeRefsTo(_.difference(refedToIds, refToIdsByExpr), function(err){
				me.createRefTo(_.difference(refToIdsByExpr, refedToIds), callback);
			});
		});	
	});
};
///////////////////////////////////////////////////////////////////
Fee.prototype.feesToFlushOnCreate = function(callback) {
	var me = this;	
	var file = me.file;
	db.feesToFlushOnFeeCreate(me._data, function(err, nfees){
		async.map(nfees, function(nfee, cb){nfee.file = file; cb(null, new Fee(nfee));}, callback);
	});
};

Fee.prototype.feesToFlushOnUpdate = function(key, value, callback) {
	var me = this;
	if (key != 'feeExpr') {
		var feeExpr = fee.feeExpr;
		var regex = 'f\\(' + key + '\\)';
		if (feeExpr.match(regex)) {
			callback(null, [me]);
		}else{
			callback(null, []);
		}
	} else {
		callback(null, [me]);
	}
};

Fee.prototype.feesToFlushOnDelete = function(callback) {
	var me = this;
	me.feesToFlushOnCreate(callback);
};
////////////////////////////////////////////////////////////////////
Fee.prototype.refToIdsByExpr = function(callback) {
	var me = this;
	var feeExpr = me.feeExpr;
	var matches = feeExpr.match(refReg) || [];
	
	async.concat(matches, function(str, cb){
		var i = str.indexOf("(");
		if(i != -1 && str[str.length-1] == ')'){
			var func = str.substr(0, i);
			var args = str.substr(i+1, str.length-i-2).split(',');
			
			args.push(true);
			args.push(cb);
			me[func].apply(me, args); 	
		}else{
			cb(null, []);
		}
	}, function(err, nodes){callback(err, _.uniq(nodes));});
};

Fee.prototype.calc = function(callback) {
	var me = this;
	var feeExpr = me.feeExpr;
	var matches = feeExpr.match(refReg) || [];

	async.each(matches, function(str, cb) {
		var i = str.indexOf("(");
		if (i != -1 && str[str.length - 1] == ')') {
			var func = str.substr(0, i);
			var args = str.substr(i + 1, str.length - i - 2).split(',');

			args.push(false);
			args.push(function(err, result) {
				feeExpr = feeExpr.replace(str, result);
				cb(null);
			});

			me[func].apply(me, args);
		} else {
			feeExpr = feeExpr.replace(str, 0);
			cb(null);
		}
	}, function(err) {
		var feeResult = 0;
		try {
			feeResult = math.eval(feeExpr);
			feeResult = feeResult.toFixed(2);
			//console.log(me.costType+'.'+me.feeName+'('+me.feeExpr+')='+feeResult);
		} catch (e) {
			feeResult = 0;
		}
		
		me.feeResult = feeResult;
		
		db.setFeeResult(me.file, me.id, feeResult, callback);
	});
};

Fee.calcs = function(file, ids, callback){
	var me = this;
	me._adj(file, ids, function(err, adj){ 
		var us = Object.keys(adj);
		var uvs = us.map(function(u){
			return {u: u, v: _.intersection(us, adj[u])};
		});
		
		var toposort = new TopoSort(uvs);
		fees = toposort.sort();	
		
		if(fees.cycle){
			callback(null);
		}else{
			async.eachSeries(fees.order, function(feeid, cb){
				Fee.get(file, feeid, function(err, fee){					
					fee.calc(cb);
				});				
			}, callback);			
		}		
	});

};

Fee._adj = function(file, ids, callback){
	db.feesAdj(file, ids, callback);
};
////////////////////////////////////////////////////////////////////
Fee.prototype.f = function(pName, ref, callback){
	var value = ref ? [] : this._data[pName];
	callback(null, value);
};

Fee.prototype.c = function(pName, ref, callback){	
	if(ref){
		var costId = this.costId;
		callback(null, [costId]);
	}else{
		var feeData = this._data;
		db._C(feeData, pName, false, callback);	
	}
};

Fee.prototype.cf = function(feeName, ref, callback){	
	var feeData = this._data;
	db._CF(feeData, feeName, ref, callback);	
};

Fee.prototype.cc = function(costType, pName, ref, callback){
	var feeData = this._data;
	db._CC(feeData, costType, pName, ref, callback);			
};

Fee.prototype.ccf = function(costType, feeName, ref, callback){
	var feeData = this._data;
	db._CCF(feeData, costType, feeName, ref, callback);	
};

Fee.prototype.cs = function(prop, ref, callback){
	var feeData = this._data;
	db._CS(feeData, prop, ref, callback);		
};

Fee.prototype.csf = function(feeName, ref, callback){
	var feeData = this._data;
	db._CSF(feeData, feeName, ref, callback);	
};

Fee.prototype.cas = function(prop, ref, callback){
	var feeData = this._data;
	db._CAS(feeData, prop, ref, callback);	
};
////////////////////////////////////////////////////////////////////////////////////
