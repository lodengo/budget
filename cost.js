var async = require('async');
var Fee = require("./fee");
var db = require("./db");

var Cost = module.exports = function Cost(_data) {
	this._data = _data;
}

Object.defineProperty(Cost.prototype, 'id', {
	get : function() {
		return this._data.id;
	}
});

Object.defineProperty(Cost.prototype, 'type', {
	get : function() {
		return this._data.type;
	}
});

Object.defineProperty(Cost.prototype, 'file', {
	get : function() {
		return this._data.file;
	}
});
/////////////////////////////////////////////////////////
Cost.create = function(file, data, parentId, callback){
	var me = this;
	var fees = data.fees || [];
	delete data.fees;
	
	db.insertCost(file, data, parentId, function(err, ncost){
		ncost.file = file;
		var cost = new Cost(ncost);
		async.each(fees, function(fee, cb) {
			cost.createFee(fee, null, cb);
		}, function(err) {
			callback(err, cost);
		});		
	});	
};

Cost.prototype.createFee = function(data, feeParentId, callback){
	var me = this;
	var costId = me.id
	var costType = me.type;
	var file = me.file;
	Fee.create(file, data, me._data, feeParentId, function(err, nfee){
		if(err) return callback(err, nfee);
		nfee.file = file;
		callback(err, new Fee(nfee));
	});
};

Cost.prototype.update = function(prop, value, callback){
	var me = this;
	var id = me.id;
	var file = me.file;
		
	var hasProp = this._data.hasOwnProperty(prop);
	var valueNotNull = (value !== undefined) && (value !== null);
	
	if(hasProp && value == me._data[prop]){
		return callback(null, 0);
	}else{
		if(hasProp && !valueNotNull){ 
			db.deleteCostProperty(file, id, prop, callback);
		}
		else if(valueNotNull){ 
			if( (!hasProp) || (value != me._data[prop]) ){
				db.setCostProperty(file, id, prop, value, callback);
			}
		}
	}	
};

Cost.prototype.del = function(callback){
	var me = this;
	var costId = me.id;
	var file = me.file;
	db.deleteCost(file, costId, callback);
};

Cost.get = function(file, id, callback){
	db.getCost(file, id, function(err, ncost){
		ncost.file = file;
		callback(err, new Cost(ncost));
	});	
};
/////////////////////////////////////////////////////////////
Cost.prototype.feesToFlushOnCreate = function(callback) {
	var me = this;
	var costId = me.id;
	var type = me.type;
	var file = me.file;
	db.feesToFlushOnCostCreate(me._data, function(err, nfees){
		async.map(nfees, function(nfee, cb){nfee.file = file; cb(null, new Fee(nfee));}, callback);
	});
}

Cost.prototype.feesToFlushOnUpdate = function(key, value, callback) {
	var me = this;
	var costId = me.id;
	var type = me.type;
	var file = me.file;
	db.feesToFlushOnCostUpdate(me._data, key, function(err, nfees){
		async.map(nfees, function(nfee, cb){nfee.file = file; cb(null, new Fee(nfee));}, callback);
	});
}

Cost.prototype.feesToFlushOnDelete = function(callback) {
	var me = this;
	var costId = me.id;
	var type = me.type;
	var file = me.file;
	db.feesToFlushOnCostDelete(me._data, function(err, nfees){
		async.map(nfees, function(nfee, cb){nfee.file = file; cb(null, new Fee(nfee));}, callback);
	});
}







