var express = require('express'), http = require('http'), path = require('path');
var Api = require("./api");

var app = express();

app.configure(function() {
	app.set('port', process.env.PORT || 3000);
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.cookieSession({
		secret : 'session_secret',
		cookie : {
			maxAge : 60 * 1000
		// 60sec
		}
	}));
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
	app.use(express.errorHandler());
});

function checkLogon(req, res, next){
	if (!req.session.uid) {
		res.status(403).json({
			success : false,
			err : 403
		});
	}else{		
		next();
	}
};

app.post('/user/logon', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	Api.userLogon(username, password, function(err, data) {
		if (err) {
			res.status(401).json({
				success : false,
				err : '用户名或密码错误'
			});
		} else {
			req.session.uid = data._id;
			delete data.password;
			res.json({
				success : true,
				result : data
			});
		}
	});
});

app.get('/user/logout', function(req, res) {
	if (req.session.uid) {
		req.session = null;
	}
	res.json({
		success : true,
		result : 0
	});
});

app.post('/user/register', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	Api.userRegister(username, password, function(err, data) {
		if (err) {
			res.json({
				success : false,
				err : err
			});
		} else {
			req.session.uid = data._id;
			delete data.password;
			res.json({
				success : true,
				result : data
			});
		}
	});
});

app.post('/file', checkLogon, function(req, res) {
	var data = req.body;
	data.created = data.created || new Date().getTime();
	data.updated = data.updated || new Date().getTime();
	Api.createFile(req.session.uid, data, function(err, result) {
		if (err) {
			res.json({
				success : false,
				err : err
			});
		} else {
			res.json({
				success : true,
				result : result
			});
		}
	});	
});

app.post('/cost', checkLogon, function(req, res) {
	var file = req.query.file;
	var data = req.body;
	var parentId = req.query.parentId;
	Api.createCost(file, data, parentId, function(err, result) {
		if (err) {
			res.json({
				success : false,
				err : err
			});
		} else {
			res.json({
				success : true,
				result : result
			});
		}
	});	
});

var server = http.createServer(app);
server.listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});

// var cluster = require('cluster');
// var numCPUs = require('os').cpus().length;
//
// if (cluster.isMaster) {
// for (var i = 0; i < numCPUs; i++) {
// cluster.fork();
// }
// } else {
// server.listen(app.get('port'), function() {
// console.log("Express server listening on port " + app.get('port'));
// });
// }
