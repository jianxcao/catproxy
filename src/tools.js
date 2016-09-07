import log from './log';
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
