var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var Fee = require("./fee");

function Budgeteer() {
	
};

inherits(Budgeteer, EventEmitter);

Budgeteer.prototype.flushFees = function(file, fees, callback) {
	async.map(fees, function(fee, cb) {
		fee.buildRef(function(err, res) {
			cb(err, fee.id);
		});
	}, function(err, ids) {
		Fee.calcs(file, ids, function(err, res) {
			if(err){console.log(err);}
			callback && callback(err);
		});
	});
};

/////////////////////////////////////////////////////
var budgeteer = new Budgeteer();

budgeteer.on('costCreated', function(file, cost) {
	var me = this;
	cost.feesToFlushOnCreate(function(err, fees) {
		me.flushFees(file, fees);
	});
});

budgeteer.on('costUpdated', function(file, cost, key, value){
	var me = this;
	cost.feesToFlushOnUpdate(key, value, function(err, fees) {
		me.flushFees(file, fees);
	})
});

budgeteer.on('costDeleted', function(file, cost){
	var me = this;
	cost.feesToFlushOnDelete(function(err, fees) {		
		me.flushFees(file, fees);		
	});
});

budgeteer.on('feeCreated', function(file, fee){
	var me = this;
	fee.feesToFlushOnCreate(function(err, fees) {				
		me.flushFees(file, fees);
	});
});

budgeteer.on('feeUpdated', function(file, fee, key, value){
	var me = this;
	fee.feesToFlushOnUpdate(key, value, function(err, fees) {				
		me.flushFees(file, fees);
	});
});

budgeteer.on('feeDeleted', function(file, fee){
	var me = this;
	fee.feesToFlushOnDelete(function(err, fees) {
		me.flushFees(file, fees);
	});
});


module.exports = budgeteer;