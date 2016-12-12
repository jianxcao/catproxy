import express from 'express';
import log from '../log';
import host from './host';
import {openCmd} from '../tools';
import err500 from './500';
import err404 from './404';
import path from 'path';
import downloadrule from './downloadrule';
import downloadcert from './downloadcert';
import merge from 'merge';
import monitor from './monitor';
export default (isHaveUi) => {
	var uiApp = express();
	uiApp.engine('.ejs', require('ejs').__express);
	uiApp.set('views', path.join( __dirname, '../../web/build'));
	uiApp.set('view engine', 'ejs');
	// 内部使用静态文件加载
	uiApp.use("/static", express.static(path.join(__dirname, '../../web/build')));
	if (isHaveUi) {
		uiApp.use(["/m", "/m.html"], monitor());
		uiApp.use(["/index", "/index.html"], host());
	}
	uiApp.use('/downloadrule.html', downloadrule());
	uiApp.use('/downloadcert.html', downloadcert());
	uiApp.use(err404);
	uiApp.use(err500);
	return uiApp;
};
