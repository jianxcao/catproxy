import getLocalIps from '../getLocalIps';
import dns from 'dns';
import changeHost from '../changeHost';
// console.log(getLocalIps()); // my ip address
// dns.lookup("p1111img1.126.net", (err, address) => {
// 	if (!err) {
// 		console.log("jjjj", address);
// 	} else {
// 		console.log(err, dns.NOTFOUND);
// 	}
// });

// dns.resolve("pimg1.126.net", function(err, addresses){
// 	console.log(addresses);
// });
// 
// 
// changeHost("pimg1.126.net", true)

// .then(address => {
// 	console.log(address);
// }, (err) => {
// 	console.log(err);
// });


// var a = '<meta charset="gb2312">';
// var b = '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
// var checkMetaCharset = /<meta(?:\s)+.*charset(?:\s)*=(?:[\s'"])*([^"']+)/;
// console.log(b.match(checkMetaCharset));
// console.log(a.match(checkMetaCharset));

// var server;
// var localIps = [];
// let getScriptStr = function() {
// 	console.log(server);
// 	let a = server.port;
// 	let port = (server || {}).___port || "";
// 	let ip = localIps[0] || "";
// 	return `<head><script src="http://${ip}:${port}/target/target-script-min.js#anonymous"></script>`;
// };
// /**
//  * 插入weinre代码
//  */
// export let insertWeinreScript = async function(data = "") {
// 	let strData = data.toString();
// 	if (true) {
// 		getScriptStr();
// 		return data;
// 	}
// 	return data;
// };

// insertWeinreScript("<head>")
// .then(null, function(err) {
// 	console.log(err);
// });
var index = 0;
var time = function() {
	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			console.log(index);
			resolve(index);
			index++; }
		, 300);
	});
};

var a = async function() {
	for(let i = 0; i < 5; i++) {
		let result = await time();
		console.log(result);
	}
};
a();
