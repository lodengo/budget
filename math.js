var math = module.exports = require('mathjs')();
math.import({
	sum : function(args) {
		var total = 0;
		var argsArray = arguments;
		Object.keys(argsArray).forEach(function(key) {
			total += argsArray[key];
		});
		return total;
	}
});