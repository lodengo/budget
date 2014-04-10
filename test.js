var Api = require("./api");
var async = require('async');

var util = require("./util");
var Fees = require("./fees");

function Tester() {
	this.file = ''; // cost file id
	this.ztgc = ''; // 整体工程id
	this.dxgc = []; // 单项工程ids
	this.dwgc = []; // 单位工程ids
	this.fbfx = []; // 分部分项ids
	this.qd = []; // 清单ids
	this.de = []; // 定额ids
	this.glj = []; // 工料机ids
	this.stats = {
		totalms : 0,
		steps : 0,
		avgms : 0,
		maxms : 0
	};
}

Tester.prototype.createFile = function(callback) {
	var me = this;
	Api.createFile('testuser', {}, function(err, file) {
		me.file = file;
		callback(null, file);
	});
}

Tester.prototype.createZtgc = function(callback) {
	var me = this;
	var ztgc = {
		type : '整体工程',
		fees: Fees['整体工程']
	};

	Api.createCost(me.file, ztgc, null, function(err, cost) {
		me.ztgc = cost.id;
		callback(null, cost);
	});
}

Tester.prototype.createDXgc = function(callback) {
	var me = this;
	var parentId = me.ztgc;
	var dxgc = {
		type : '单项工程',
		fees: Fees['单项工程']
	};

	Api.createCost(me.file, dxgc, parentId, function(err, cost) {
		me.dxgc.push(cost.id);
		callback(null, cost);
	});
}

Tester.prototype.createDwgc = function(callback) {
	var me = this;
	var dwgc = {
		type : '单位工程',
		fees: Fees['单位工程']
	};

	var parentId = me.dxgc.random();
	if (!parentId) {
		return callback(null);
	}
	Api.createCost(me.file, dwgc, parentId, function(err, cost) {
		me.dwgc.push(cost.id);
		callback(null, cost);
	});
}

Tester.prototype.createFbfx = function(callback) {
	var me = this;
	var fbfx = {
		type : '分部分项',
		fees: Fees['分部分项']
	};

	var parentId = me.dwgc.random();
	if (!parentId) {
		return callback(null);
	}
	Api.createCost(me.file, fbfx, parentId, function(err, cost) {
		me.fbfx.push(cost.id);
		callback(null, cost);
	});
}

Tester.prototype.createQd = function(callback) {
	var me = this;
	var qd = {
		type : '清单',
		quantity : Math.random() * 1000,
		fees: Fees['清单']
	};

	var parentId = me.fbfx.random();
	if (!parentId) {
		return callback(null);
	}
	Api.createCost(me.file, qd, parentId, function(err, cost) {
		me.qd.push(cost.id);
		callback(null, cost);
	});
}

Tester.prototype.createDe = function(callback) {
	var me = this;
	var de = {
		type : '定额',
		quantity : Math.random() * 1000,
		fees: Fees['定额']
	};

	var parentId = me.qd.random();
//	if (!parentId) {
//		return callback(null);
//	}
	Api.createCost(me.file, de, parentId, function(err, cost) {
		me.de.push(cost.id);
		callback(null, cost);
	});
}

Tester.prototype.createGlj = function(callback) {
	var me = this;
	var types = [ "人工", "材料", "机械" ];
	var type = types[Math.floor(Math.random() * 10) % 3];
	var glj = {
		'type' : type,
		'price' : Math.random() * 100,
		'content' : Math.random(),
		fees: Fees[type]
	};

	var parentId = me.de.random();
	if (!parentId) {
		return callback(null);
	}
	Api.createCost(me.file, glj, parentId, function(err, cost) {
		me.glj.push(cost.id);
		callback(null, cost);
	});
}

// 修改工程量
Tester.prototype.modGcl = function(callback) {
	var me = this;
	var modQd = Math.random() < 0.5;
	var nid = modQd ? me.qd.random() : me.de.random();
	if (!nid) {
		return callback(null);
	}
	var gcl = Math.random() * 1000;

	Api.updateCost(me.file, nid, 'quantity', gcl, function(err, res) {
		callback(err);
	});
}

// 删除清单或定额
Tester.prototype.delNode = function(callback) {
	var me = this;
	var delQd = Math.random() < 0.5;
	var nid = delQd ? me.qd.random() : me.de.random();
	if (!nid) {
		return callback(null);
	}
	Api.deleteCost(me.file, nid, function(err, res) {
		delQd ? me.qd.remove(nid) : me.de.remove(nid);
		callback(err);
	});
}
// //////////////////////////////////////////////////////
Tester.prototype.step = function(startAt, action) {
	var me = this;
	var ms = new Date() - startAt;
	console.log([ action, ms ]);
	me.stats.totalms += ms;
	me.stats.steps += 1;
	me.stats.avgms = me.stats.totalms / me.stats.steps;
	me.stats.maxms = ms > me.stats.maxms ? ms : me.stats.maxms;
}

Tester.prototype.run = function(actions) {
	var me = this;
	async.eachSeries(Object.keys(actions), function(action, cb) {
		var n = actions[action];
		async.timesSeries(n, function(n, next) {
			var startAt = new Date();
			me[action].apply(me, [ function(err, res) {
				me.step(startAt, action);
				next(err, res);
			} ]);
		}, function(err, results) {
			cb(err);
		});
	}, function(err) {
		if(err) console.log(['err:', err]);
		console.log('done');
		console.log(me.stats);
		console.log(util.dbstats.stats());
	});
}

//////////////////////////////////
var tester = new Tester();
var actions = {
	createFile : 1,
	createZtgc: 1,
	createDXgc: 2,
	createDwgc: 4,
	createFbfx: 8,
	createQd: 16,
	createDe: 32,
	createGlj: 64	
};
tester.run(actions);

