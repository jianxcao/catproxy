import * as middleware from '../requestMiddleware';
var a = (req, res, next)=> {
	setTimeout(function() {
		console.log('a', req, res);
		next();
	}, 300);
};
var b = (req, res, next) => {
	console.log('b', req, res);
	next();
	
};

var c = (req, res, next) => {
	setTimeout(function() {
		console.log('c', req, res);
		next();
	}, 300);
};

middleware.use(a);
middleware.use(b);
middleware.use(c);
middleware.middleWare(function(req, res) {
	console.log('final success', req, res);
})({req: 1}, {res : 1});
