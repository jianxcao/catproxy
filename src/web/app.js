import express from 'express';
import log from '../log';
import main from './main';
import err500 from './500';
import err404 from './404';
import path from 'path';
import bodyParser from 'body-parser';
import http from 'http';
import wServer from '../ws/ws';

var server = http.createServer();
var uiApp = express();
uiApp.engine('.ejs', require('ejs').__express);
uiApp.set('views', path.join( __dirname, '../../web/build'));
uiApp.set('view engine', 'ejs');
// 内部使用静态文件加载
uiApp.use("/static", express.static(path.join(__dirname, '../../web/build')));
uiApp.use(bodyParser.json()); // for parsing application/json
uiApp.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
uiApp.use(["/", "/index.html"], main());
uiApp.use(err404);
uiApp.use(err500);
server.on('request', uiApp);

var wsConnect = () => {
	wServer(server);
};

export default (port) => {
	wsConnect();
	server.listen(port, function() {
		log.info('ui server start up:  http://127.0.0.1:' + port);
	});
};
