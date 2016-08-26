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
