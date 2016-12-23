const tls = require('tls');
const fs = require('fs');
const path = require('path');
const https = require('https');
const net = require('net');
const url = require('url');
const options = {
	// // These are necessary only if using the client certificate authentication
	// key: fs.readFileSync('/Users/jxcao/Downloads/2.key'),
	// cert: fs.readFileSync('/Users/jxcao/Downloads/2.crt'),
	// // This is necessary only if the server uses the self-signed certificate
	ca: [ fs.readFileSync('/Users/jxcao/Downloads/cert.crt') ],
	host: "www.baidu.com",
	port: 443,
	path: "", // cdn/desktop/index/main.0cf10bc449.js
	rejectUnauthorized: true,
	headers: {
		"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36",
		"cookie": "_ntes_nnid=5f3062f82d960111e41f1f71737ec0be,1479703849476; cid=315803048; P_INFO=jianxcao@126.com|1480318745|1|lmlc|11&19|bej&1480310183&mail_client#bej&null#10#0#0|185051&0|caipiao&kaola&yiyuangou&mail126&blog|jianxcao@126.com;NTES_PASSPORT=bIi5T6IjZ75EbMr.zSmJ8oJpWqZygTaZxPENt00hvuS.8ptA.y5u3P5wLo2O4BseKmewVeM3dQy7S12fhB9.Dvty.YTyO9ArJVqBn411Lw6V9inPMH03sGaPd; _ntes_nuid=e93426bc5f42b96ffb17c509ce4c350c; JSESSIONID0=af9ee4adf26fa50df03fbc7fe5166e47; sid=315803048_1482217522151; _gat=1; _ga=GA1.2.1764537290.1479703850; JSESSIONID=936ECC04A4AD9A2695619FC0F5BDD33B",
		"if-modified-since": "Thu, 15 Dec 2016 16:46:57 GMT",
		"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
		"host": "www.baidu.com",
		"cache-control": "max-age=0",
		"accept-encoding": "gzip, deflate, sdch, br",
		"accept-language": "zh-CN,zh;q=0.8,en;q=0.6",
		"connection": "keep-alive"
	}
};
options.checkServerIdentity = checkServerIdentity;

function checkServerIdentity(host, cert) {
	
	// return new Error("Unknown");
	// Create regexp to much hostnames
	function regexpify(host, wildcards) {
		// Add trailing dot (make hostnames uniform)
		if (!host || !host.endsWith('.')) host += '.';

		// The same applies to hostname with more than one wildcard,
		// if hostname has wildcard when wildcards are not allowed,
		// or if there are less than two dots after wildcard (i.e. *.com or *d.com)
		//
		// also
		//
		// "The client SHOULD NOT attempt to match a presented identifier in
		// which the wildcard character comprises a label other than the
		// left-most label (e.g., do not match bar.*.example.net)."
		// RFC6125
		if (!wildcards && /\*/.test(host) || /[\.\*].*\*/.test(host) ||
				/\*/.test(host) && !/\*.*\..+\..+/.test(host)) {
			return /$./;
		}

		// Replace wildcard chars with regexp's wildcard and
		// escape all characters that have special meaning in regexps
		// (i.e. '.', '[', '{', '*', and others)
		var re = host.replace(
				/\*([a-z0-9\\-_\.])|[\.,\-\\\^\$+?*\[\]\(\):!\|{}]/g,
				function(all, sub) {
					if (sub) return '[a-z0-9\\-_]*' + (sub === '-' ? '\\-' : sub);
					return '\\' + all;
				});

		return new RegExp('^' + re + '$', 'i');
	}

	var dnsNames = [];
	var uriNames = [];
	const ips = [];
	var matchCN = true;
	var valid = false;
	var reason = 'Unknown reason';

	// There're several names to perform check against:
	// CN and altnames in certificate extension
	// (DNS names, IP addresses, and URIs)
	//
	// Walk through altnames and generate lists of those names
	if (cert.subjectaltname) {
		cert.subjectaltname.split(/, /g).forEach(function(altname) {
			var option = altname.match(/^(DNS|IP Address|URI):(.*)$/);
			if (!option)
				return;
			if (option[1] === 'DNS') {
				dnsNames.push(option[2]);
			} else if (option[1] === 'IP Address') {
				ips.push(option[2]);
			} else if (option[1] === 'URI') {
				var uri = url.parse(option[2]);
				if (uri) uriNames.push(uri.hostname);
			}
		});
	}

	// If hostname is an IP address, it should be present in the list of IP
	// addresses.
	if (net.isIP(host)) {
		valid = ips.some(function(ip) {
			return ip === host;
		});
		if (!valid) {
			reason = `IP: ${host} is not in the cert's list: ${ips.join(', ')}`;
		}
	} else if (cert.subject) {
		// Transform hostname to canonical form
		if (!host || !host.endsWith('.')) host += '.';

		// Otherwise check all DNS/URI records from certificate
		// (with allowed wildcards)
		dnsNames = dnsNames.map(function(name) {
			return regexpify(name, true);
		});

		// Wildcards ain't allowed in URI names
		uriNames = uriNames.map(function(name) {
			return regexpify(name, false);
		});

		dnsNames = dnsNames.concat(uriNames);

		if (dnsNames.length > 0) matchCN = false;

		// Match against Common Name (CN) only if no supported identifiers are
		// present.
		//
		// "As noted, a client MUST NOT seek a match for a reference identifier
		//  of CN-ID if the presented identifiers include a DNS-ID, SRV-ID,
		//  URI-ID, or any application-specific identifier types supported by the
		//  client."
		// RFC6125
		if (matchCN) {
			var commonNames = cert.subject.CN;
			if (Array.isArray(commonNames)) {
				for (var i = 0, k = commonNames.length; i < k; ++i) {
					dnsNames.push(regexpify(commonNames[i], true));
				}
			} else {
				dnsNames.push(regexpify(commonNames, true));
			}
		}

		valid = dnsNames.some(function(re) {
			return re.test(host);
		});

		if (!valid) {
			if (cert.subjectaltname) {
				reason =
						`Host: ${host} is not in the cert's altnames: ` +
						`${cert.subjectaltname}`;
			} else {
				reason = `Host: ${host} is not cert's CN: ${cert.subject.CN}`;
			}
		}
	} else {
		reason = 'Cert is empty';
	}
	if (!valid) {
		var err = new Error(
				`Hostname/IP doesn't match certificate's altnames: "${reason}"`);
		err.reason = reason;
		err.host = host;
		err.cert = cert;
		return err;
	}
};

var req = https.request(options, function(res) {
	console.log(res.headers);
	res.on('data', function(chunk) {
		console.log(chunk);
	});
});
req.end();
