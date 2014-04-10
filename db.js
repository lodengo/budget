var async = require('async');
var Server = require('mongodb').Server, Db = require('mongodb').Db, ObjectID = require('mongodb').ObjectID, ReplSetServers = require('mongodb').ReplSetServers, MongoClient = require('mongodb').MongoClient
var util = require("./util");

var poolModule = require('generic-pool');
var dbPool = poolModule.Pool({
	name : 'dbs',
	create : function(callback) {
		MongoClient.connect('mongodb://127.0.0.1:27017/cost', {
			server : {
				poolSize : 1
			}
		}, callback);
	},
	destroy : function(db) {
		db.close();
	},
	max : 1024,
	log : false 
});

var db = module.exports = function db() {
//	dbPool.acquire(function(err, _db) {
//		_db.cost.ensureIndex({parentId:1});
//		_db.cost.ensureIndex({ancestor:1});
//		_db.cost.ensureIndex({type:1});
//		_db.cost.ensureIndex({refFrom:1});
//		_db.cost.ensureIndex({costId:1});
//		_db.cost.ensureIndex({costParentId:1});
//		_db.cost.ensureIndex({costAncestor:1});
//		_db.cost.ensureIndex({costType:1});
//		_db.cost.ensureIndex({feeName:1});
//		_db.cost.ensureIndex({feeExpr:1});
//		_db.cost.ensureIndex({refTo:1});
//		dbPool.release(_db);
//	});
};

function objectId(){
	return new ObjectID().toHexString();
//	return require('node-uuid').v4();
}

db.userLogon = function(username, password, callback){
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('user').findOne({username:username, password:password}, function(err, doc){
			dbPool.release(_db);
			
			if(!doc){
				err = "用户名或密码错误";
			}
			callback(err, doc);
		});
	});
};

db.userRegister = function(username, password, callback){
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('user').count({username:username}, function(err, count){
			if(err || count){
				dbPool.release(_db);
				if(count){
					err = "用户名已注册";
				}
				
				callback(err, null);
			}else{
				var user = {username:username, password:password};
				user._id = user.id = objectId();
				_db.collection('user').insert(user, {}, function(err, doc){
					dbPool.release(_db);
					callback(err, doc[0]);
				});
			}
		});
	});
};

db.createFile = function(data, callback) {
	data._id = data.id = objectId();
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('file').insert(data, {}, function(err, doc){
			dbPool.release(_db);
			callback(err, data._id);
		});
	});	
}

db.getCost = function(file, id, callback) {
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').findOne({
			_id : id
		}, {
			fields : {
				ancestor : -1,
				refFrom : -1
			}
		}, function(err, doc) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'getCost');
			callback(err, doc);
		});
	});
}

db.insertCost = function(file, data, parentId, callback) {
	var me = this;
	data.nodeType = 'cost';
	data.file = file;
	data._id = data.id = objectId();
	data.refFrom = [];

	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		if (parentId) {
			data.parentId = parentId;
			me.getCost(file, parentId, function(err, parent) {
				data.ancestor = parent.ancestor.concat(parentId);
				_db.collection('cost').insert(data, {}, function(err, doc) {
					dbPool.release(_db);
					util.dbstats.finish(start, 'insertCost');
					callback(err, doc[0]);
				});
			});
		} else {
			data.parentId = null;
			data.ancestor = [];
			_db.collection('cost').insert(data, {}, function(err, doc) {
				dbPool.release(_db);
				util.dbstats.finish(start, 'insertCost');
				callback(err, doc[0]);
			});
		}
	});
}

db.deleteCost = function(file, costId, callback) {
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		var selector = {
			$or : [ {
				_id : costId
			}, {
				//nodeType : 'cost',
				ancestor : {
					$all : [ costId ]
				}
			}, {
				//nodeType : 'fee',
				$or : [ {
					costId : costId
				}, {
					costAncestor : {
						$all : [ costId ]
					}
				} ]
			} ]
		};
		_db.collection('cost').remove(selector, {}, function(err, data) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'deleteCost');
			callback(err, data);
		});
	});
}

db.setCostProperty = function(file, id, prop, value, callback) {
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').update({
			_id : id
		}, {
			$set : {
				prop : value
			}
		}, {}, function(err, data) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'setCostProperty');
			callback(err, data);
		});
	});
}

db.deleteCostProperty = function(file, id, prop, callback) {
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').update({
			_id : id
		}, {
			$unset : {
				prop : ''
			}
		}, {}, function(err, data) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'deleteCostProperty');
			callback(err, data);
		});
	});
}

db.feesToFlushOnCostCreate = function(costData, callback) {
	var costId = costData.id;
	var parentId = costData.parentId;
	var type = costData.type;
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').find({
			$or : [ {
				costId : costId,
				//nodeType : 'fee'
			}, {
				//nodeType : 'fee',
				costId : parentId,
				feeExpr : {
					$regex : ".*cc.?\\(" + type
				}
			}, {
				//nodeType : 'fee',
				costParentId : parentId,
				costId : {
					$ne : costId
				},
				feeExpr : {
					$regex : ".*cs.?\\("
				}
			} ]
		}, {}).toArray(function(err, docs) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'feesToFlushOnCostCreate');
			callback(err, docs);
		});
	});
}

db.feesToFlushOnCostUpdate = function(costData, key, callback) {
	var costId = costData.id;
	var parentId = costData.parentId;
	var type = costData.type;
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').find({
			$or : [ {
				costId : costId,
				//nodeType : 'fee',
				feeExpr : {
					$regex : ".*cas\\(" + key + "|c\\(" + key
				}
			}, {
				//nodeType : 'fee',
				costId : parentId,
				feeExpr : {
					$regex : ".*cc\\(" + type + "," + key
				}
			}, {
				//nodeType : 'fee',
				costParentId : parentId,
				costId : {
					$ne : costId
				},
				feeExpr : {
					$regex : ".*cs\\(" + key
				}
			}, {
				//nodeType : 'fee',
				costAncestor : {
					$all : [ costId ]
				},
				feeExpr : {
					$regex : ".*cas\\(" + key
				}
			} ]
		}, {}).toArray(function(err, docs) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'feesToFlushOnCostUpdate');
			callback(err, docs);
		});
	});
}

db.feesToFlushOnCostDelete = function(costData, callback) {
	var costId = costData.id;
	var parentId = costData.parentId;
	var type = costData.type;
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').find({
			$or : [ {
				//nodeType : 'fee',
				costId : parentId,
				feeExpr : {
					$regex : ".*cc.?\\(" + type
				}
			}, {
				//nodeType : 'fee',
				costParentId : parentId,
				costId : {
					$ne : costId
				},
				feeExpr : {
					$regex : ".*cs.?\\("
				}
			} ]
		}, {}).toArray(function(err, docs) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'feesToFlushOnCostDelete');
			callback(err, docs);
		});
	});
}

db.getFee = function(file, id, callback) {
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').findOne({
			_id : id
		}, {}, function(err, doc) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'getFee');
			callback(err, doc);
		});
	});
}

db.createFee = function(file, data, costData, parentId, callback) {
	var me = this; 
	var childFees = data.fee || [];
	delete data.fee;

	data.nodeType = 'fee';	
	data.costId = costData.id;
	data.costParentId = costData.parentId;
	data.costAncestor = costData.ancestor;
	data.costType = costData.type;
	data.refTo = [];
	data.refFrom = [];
	
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		if (parentId) {
			data.parentId = parentId;
			_db.collection('cost').findOne({
				_id : parentId
			}, {
				fields : {
					ancestor : 1
				}
			}, function(err, parent) {
				data.ancestor = parent.ancestor.concat(parentId); 
				data._id = data.id = objectId();
				_db.collection('cost').insert(data, {}, function(err, doc) {
					dbPool.release(_db);
					async.each(childFees, function(cfee, cb) {
						me.createFee(file, cfee, costData, doc[0].id, cb)
					}, function(err) {	
						util.dbstats.finish(start, 'createFee');
						callback(err, doc[0]);
					});
				});
			});
		} else {
			data.parentId = null;
			data.ancestor = [];
			data._id = data.id = objectId();
			_db.collection('cost').insert(data, {}, function(err, doc) {
				dbPool.release(_db);
				async.each(childFees, function(cfee, cb) {
					me.createFee(file, cfee, costData, doc[0].id, cb)
				}, function(err) {	
					util.dbstats.finish(start, 'createFee');
					callback(err, doc[0]);
				});
			});
		}
	});
}

db.setFeeProperty = function(file, id, prop, value, callback) {
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').update({
			_id : id
		}, {
			$set : {
				prop : value
			}
		}, {}, function(err, data) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'setFeeProperty');
			callback(err, data);
		});
	});
}

db.deleteFeeProperty = function(file, id, prop, callback) {
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').update({
			_id : id
		}, {
			$unset : {
				prop : ''
			}
		}, {}, function(err, data) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'deleteFeeProperty');
			callback(err, data);
		});
	});
}

db.deleteFee = function(file, id, callback) {
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').remove({
			$or : [ {
				_id : id
			}, {
				ancestor : {
					$all : [ id ]
				}
			} ]
		}, {}, function(err, data) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'deleteFee');
			callback(err, data);
		});
	});
}

db.setFeeResult = function(file, id, feeResult, callback) {
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').update({
			_id : id
		}, {
			$set : {
				feeResult : feeResult
			}
		}, {}, function(err, data) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'setFeeResult');
			callback(err, data);
		});
	});
}

db.feesAdj = function(file, ids, callback) {
	this._feesAdj(file, ids, {}, callback);	
}

db._feesAdj = function(file, ids, adj, callback){
	var me = this;
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').find({_id:{$in: ids}}, {}).toArray(function(err, docs) {
			async.concat(docs, function(r, cb){
				var id = r.id;
				var tos = r.refTo ? [].concat(r.refTo) : [];
				adj[id] = adj[id] ? adj[id].concat(tos) : tos;
				cb(null, r.refFrom? r.refFrom : []);
			}, function(err, froms){
				dbPool.release(_db);
				if(froms.length > 0){
					me._feesAdj(file, froms, adj, callback);
				}else{
					util.dbstats.finish(start, 'feesAdj');
					callback(err, adj);
				}
			});
		});
	});
}

db.feesToFlushOnFeeCreate = function(feeData, callback) {
	var me = this;
	var file = feeData.file;
	var costId = feeData.costId;
	var type = feeData.CostType;
	var feeName = feeData.feeName;
	var parentId = feeData.costParentId;

	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').find({
			$or : [ {
				//nodeType : 'fee',
				costId : costId,
				feeExpr : {
					$regex : ".*cf\\("+feeName
				}
			}, {
				//nodeType : 'fee',
				costId: parentId,
				feeExpr : {
					$regex : ".*ccf\\("+type+","+feeName
				}
			}, {
				//nodeType : 'fee',
				costParentId:parentId,
				costId: {$ne: costId},
				feeExpr : {
					$regex : ".*csf\\("+feeName
				}
			} ]
		}, {}).toArray(function(err, docs) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'feesToFlushOnFeeCreate');
			callback(err, docs);
		});
	});
}

db.createRefsTo = function(feeData, toIds, callback) {
	var id = feeData.id;
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').update({
			_id : id
		}, {
			$addToSet : {
				refTo : {
					$each : toIds
				}
			}
		}, {}, function(err, data) {
			_db.collection('cost').update({
				_id : {
					$in : toIds
				}
			}, {
				$addToSet : {
					refFrom : id
				}
			}, {multi:true}, function(err, data) {
				dbPool.release(_db);
				util.dbstats.finish(start, 'createRefsTo');
				callback(err, data);
			});
		});
	});
}

db.removeRefsTo = function(feeData, toIds, callback) {
	var id = feeData.id;
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').update({
			_id : id
		}, {
			$pullAll : {
				refTo : {
					$each : toIds
				}
			}
		}, {}, function(err, data) {
			_db.collection('cost').update({
				_id : {
					$in : toIds
				}
			},  {
				$pull : {
					refFrom : id
				}
			}, {multi:true}, function(err, data) {
				dbPool.release(_db);
				util.dbstats.finish(start, 'removeRefsTo');
				callback(err, data);
			});
		});
	});
}

db.feeRefedToIds = function(feeData, callback) {
	if(feeData.refTo){
		return callback(null, feeData.refTo);
	}
	
	var id = feeData.id;
	// callback(null, feeData.refTo);
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').findOne({
			_id : id
		}, {
			fields : {
				refTo : 1
			}
		}, function(err, data) {
			dbPool.release(_db);
			util.dbstats.finish(start, 'feeRefedToIds');
			callback(err, data.refTo);
		});
	});
}
// ///////////////////////////////////////////////////////////////////
db._C = function(feeData, prop, getId, callback) {
	var costId = feeData.costId;
	var fields = {id:1};
	fields[prop] = 1;
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').find({
			_id : costId
		}, {
			fields : fields
		}).toArray(function(err, docs) {
			dbPool.release(_db);
			var values = docs.map(function(e) {
				return getId ? e.id : e[prop];
			});
			util.dbstats.finish(start, 'c');
			callback(err, values);
		});
	});
}

db._CF = function(feeData, feeName, getId, callback) {
	var costId = feeData.costId;
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').find({
			//nodeType : 'fee',
			costId : costId,
			feeName : feeName
		}, {
			fields : {
				id : 1,
				feeResult : 1
			}
		}).toArray(function(err, docs) {
			dbPool.release(_db);
			var values = docs.map(function(e) {
				return getId ? e.id : e.feeResult;
			});
			util.dbstats.finish(start, 'cf');
			callback(err, values);
		});
	});
}

db._CC = function(feeData, type, prop, getId, callback) {
	var costId = feeData.costId;
	var fields = {id:1};
	fields[prop] = 1;
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').find({
			parentId : costId,
			type : type
		}, {
			fields : fields
		}).toArray(function(err, docs) {
			dbPool.release(_db);
			var values = docs.map(function(e) {
				return getId ? e.id : e[prop];
			});
			util.dbstats.finish(start, 'cc');
			callback(err, values);
		});
	});
}

db._CCF = function(feeData, type, feeName, getId, callback) {
	var costId = feeData.costId;
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').find({
			costParentId : costId,
			costType : type,
			feeName : feeName
		}, {
			fields : {
				id : 1,
				feeResult : 1
			}
		}).toArray(function(err, docs) {
			dbPool.release(_db);
			var values = docs.map(function(e) {
				return getId ? e.id : e.feeResult;
			});
			util.dbstats.finish(start, 'ccf');
			callback(err, values);
		});
	});
}

db._CS = function(feeData, prop, getId, callback) {
	var parentId = feeData.costParentId;
	var costId = feeData.costId;
	var fields = {id:1};
	fields[prop] = 1;
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').find({
			parentId : parentId,
			id : {
				$ne : costId
			}
		}, {
			fields : fields
		}).toArray(function(err, docs) {
			dbPool.release(_db);
			var values = docs.map(function(e) {
				return getId ? e.id : e[prop];
			});
			util.dbstats.finish(start, 'cs');
			callback(err, values);
		});
	});
}

db._CSF = function(feeData, feeName, getId, callback) {
	var parentId = feeData.costParentId;
	var costId = feeData.costId;
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').find({
			costParentId : parentId,
			costId : {
				$ne : costId
			},
			feeName : feeName
		}, {
			fields : {
				id : 1,
				feeResult : 1
			}
		}).toArray(function(err, docs) {
			dbPool.release(_db);
			var values = docs.map(function(e) {
				return getId ? e.id : e.feeResult;
			});
			util.dbstats.finish(start, 'csf');
			callback(err, values);
		});
	});
}

db._CAS = function(feeData, prop, getId, callback) {
	var me = this;
	var costId = feeData.costId;
	me._cas(costId, prop, getId, callback);
}

db._cas = function(costId, prop, getId, callback){
	var me = this;
	if(!costId) return callback(null, []);
	var fields = {id:1};
	fields[prop] = 1;
	dbPool.acquire(function(err, _db) {if(err) console.log(err);var start = new Date();
		_db.collection('cost').findOne({id:costId}, {fields : fields}, function(err, doc){
			if(doc[prop]){
				dbPool.release(_db);
				var values = getId? [doc.id]: [doc[prop]];
				util.dbstats.finish(start, 'cas');
				callback(err, values);
			}else{
				var parentId = doc.parentId;				
				me._cas(parentId, prop, getId, callback);
			}
		});
	});
}