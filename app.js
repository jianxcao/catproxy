#!/usr/bin/env node
// catproxy cmd file

require('./build/bin');

// catproxy main file
var app = require('./build/app');
var catProxy = new app.CatProxy();
//初始化代理服务器
catProxy.init();

