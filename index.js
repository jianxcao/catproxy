// catproxy main file
var app = require('./build/app');

var catProxy = new app.CatProxy();
catProxy.init();
