import express from 'express';
import log from '../log';
import main from './main';
import err500 from './500';
import err404 from './404';
import path from 'path';
import bodyParser from 'body-parser';
import http from 'http';
import wServer from '../ws/ws';
import downloadrule from './downloadrule';
import merge from 'merge';
import webCfg from '../config/webCfg';

export default (option) => {
	option = merge({}, webCfg, option);
	var server = http.createServer();
	var uiApp = express();
	uiApp.engine('.ejs', require('ejs').__express);
	uiApp.set('views', path.join( __dirname, '../../web/build'));
	uiApp.set('view engine', 'ejs');
	// 内部使用静态文件加载
	uiApp.use("/static", express.static(path.join(__dirname, '../../web/build')));
	uiApp.use(bodyParser.json()); // for parsing application/json
	uiApp.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
	uiApp.use(["/", "/index.html"], main(option));
	uiApp.use('/downloadrule.html', downloadrule());
	uiApp.use(err404);
	uiApp.use(err500);
	server.on('request', uiApp);

	//链接ws 服务器
	wServer(server);
	server.listen(option.port, function() {
		log.info(`ui server start up:  ${option.host}`);
	});
	server.on('error', err => {
		if (err.message && err.message.indexOf("EACCES") > -1) {
			log.error("请用sudo管理员权限打开");
			process.exit(1);
		} else if (err.message.indexOf("EADDRINUSE") > -1) {
			log.error(`端口${option.port}被占用，请检查端口占用情况`);
			process.exit(1);
		} else {
			log.error("出现错误：" + err.stack);
		}
	});
};
