import log from './log';
import childProcess from 'child_process';
export let getUrl = ({port, path: pathname, protocol, hostname, host})=> {
	if (protocol && (hostname || host)) {
		hostname = hostname || host;
		hostname = hostname.split(':')[0];
		protocol === "https" ? "http" : "https";
		if (+port === 80 && protocol === "http") {
			port = "";
		}
		if (+port === 443 && protocol === "https") {
			port = "";
		}
		if (port) {
			port  = ":" + port;
		}
		pathname = pathname || "";
		return `${protocol}://${hostname}${port}${pathname}`;
	}
};

export let writeErr = (err) => {
	err = err || "系统内部错误";
	if (err.stack && err.message) {
		err = err.message + "<br>" + err.stack;
	}
	return err;
};

let portReg = /EADDRINUSE\s*[^0-9]*([0-9]+)/i;

export let error = err => {
	if (err.message && err.message.indexOf("EACCES") > -1) {
		log.error("请用sudo管理员权限打开");
		process.exit(1);
	} else if (err.message.indexOf("EADDRINUSE") > -1) {
		let port = err.message.match(portReg);
		port  = port && port.length > 1 ? port[1] : "";
		log.error(`端口${port}被占用，请检查端口占用情况`);
		process.exit(1);
	} else {
		log.error("出现错误：" + err.stack);
	}
};

export let openCmd = uri => {
	var cmd;
	if (process.platform === 'win32') {
		cmd = 'start';
	} else if (process.platform === 'linux') {
		cmd = 'xdg-open';
	} else if (process.platform === 'darwin') {
		cmd = 'open';
	}
	childProcess.exec([cmd, uri].join(' '));
};

export let sendErr = (res, err, uri) => {
	if (!res) {
		return;
	}
	err = err || "";
	log.error(err);
	if (uri) {
		log.error('error url: ' + uri);
	}
	if (res.finished) {
		return;
	}
	var message = "";
	var t = typeof err;
	if (t === 'string') {
		message = err;
	} else if(t === 'object') {
		message = (err.message || "") + (err.msg || "") + (err.stack || ""); 
	}
	res.headers = res.headers || {};
	if (!res.headers['content-type']|| !res.headers['Content-Type']) {
		res.headers['Content-Type'] = "text/html; charset=utf-8";
	}
	let statusCode = '500';
	if (err.message && err.message.indexOf('ETIMEDOUT') > -1) {
		statusCode = '504';
	}
	res.writeHead(statusCode, res.headers);
	res.end(message);
};
