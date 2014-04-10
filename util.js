Array.prototype.remove = function(element) {
	var idx = this.indexOf(element);
	if (idx != -1) {
		this.splice(idx, 1);
	}
};

Array.prototype.random = function() {
	var len = this.length;
	var idx = Math.floor(Math.random() * len);
	return this[idx];
};

Array.prototype.shuffle = function() {
	var o = this;
	for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x)
		;
	return o;
};
// //////////////////////////////////////////////////
exports.dbstats = {
	totalms : 0,
	querys : 0,
	avgms : 0,
	maxms : 0,
	querystats : {},
	stats: function(){
		var me = this;
		var querystats = Object.keys(me.querystats).map(function(k){return me.querystats[k]});
		querystats.sort(function(a,b){return b.totalms - a.totalms});
		
		return {
			//totalms: me.totalms,
			querys: me.querys,
			avgms: me.avgms,
			maxms: me.maxms,
			querystats: querystats
		};
	},
	finish : function(start, query) {
		var me = this;
		var ms = new Date() - start;
		me.totalms += ms;
		me.querys += 1;
		me.avgms = me.totalms / me.querys;
		me.maxms = ms > me.maxms ? ms : me.maxms;
		var md5 = require('crypto').createHash('md5').update(query).digest('hex');
		me.querystats[md5] = me.querystats[md5] ? {
			query : query,
			totalms : me.querystats[md5].totalms + ms,
			querys : me.querystats[md5].querys + 1,
			avgms : me.querystats[md5].totalms / me.querystats[md5].querys,
			maxms : ms > me.querystats[md5].maxms ? ms
					: me.querystats[md5].maxms
		} : {
			query : query,
			totalms : ms,
			querys : 1,
			avgms : ms,
			maxms : ms
		};
	}
};

