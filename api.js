var async = require('async');
var Cost = require("./cost");
var Fee = require("./fee");
var db = require("./db");
var budgeteer = require('./budgeteer');
var crypto = require('crypto');

var Api = module.exports = function Api() {

};

Api.userLogon = function(username, password, cb){
	var password = crypto.createHash('md5').update(password).digest('hex');
	db.userLogon(username, password, cb);
};

Api.userRegister = function(username, password, cb){
	var password = crypto.createHash('md5').update(password).digest('hex');
	db.userRegister(username, password, cb);
};

Api.createFile = function(userId, data, callback){
	data.userId = userId;
	db.createFile(data, callback);
};
// ////////////////////////////////////////////////////////
Api.createCost = function(file, data, parentId, callback) {
	var me = this;	
	Cost.create(file, data, parentId, function(err, cost) {
		budgeteer.emit('costCreated', file, cost);
		callback(err, cost);		
	});
};

Api.updateCost = function(file, id, key, value, callback) {
	var me = this; 
	Cost.get(file, id, function(err, cost) {
		cost.update(key, value, function(err, res) {
			budgeteer.emit('costUpdated', file, cost, key, value);
			callback(err, res);			
		})
	});
};

Api.deleteCost = function(file, id, callback) {
	var me = this;
	Cost.get(file, id, function(err, cost) {
		cost.del(function(err, res) {
			budgeteer.emit('costDeleted', file, cost);
			callback(err, res);	
		});		
	});
};

Api.createFee = function(file, data, costId, parentId, callback) {
	var me = this;
	Cost.get(file, id, function(err, cost) {
		cost.createFee(data, parentId, function(err, fee) {
			budgeteer.emit('feeCreated', file, fee);
			callback(err, fee);			
		});
	});
};

Api.updateFee = function(file, id, key, value, callback) {
	Fee.get(file, id, function(err, fee) {
		fee.update(key, value, function(err, res) {
			budgeteer.emit('feeUpdated', file, fee, key, value);
			callback(err, res);			
		})
	});
};

Api.deleteFee = function(file, id, callback) {
	Fee.get(file, id, function(err, fee) {
		fee.del(function(err, res){
			budgeteer.emit('feeDeleted', file, fee);
			callback(err, res);	
		});		
	});
};
