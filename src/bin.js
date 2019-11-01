import program from 'commander';
import pkg from '../package.json';
import read from 'read';
import colors from 'colors';
import CatProxy from './app';
import log from './log';
import * as cert from './cert/cert.js';
import configProps from './config/configProps';
import { error as errFun } from './tools';
process.on('uncaughtException', errFun);
// 将字段变成list
let numReg = /^([0-9]){2,}$/;
let list = val => {
	val = val.split(',');
	val = val.filter(current => {
		return numReg.test(current);
	});
	return val.length ? val : undefined;
};
let convertToInt = num => {
	let val = parseInt(num);
	return isNaN(val) ? undefined : val;
};

function promptCert(prompt, callback) {
	if (!callback) {
		return;
	}
	read({ prompt: prompt }, function(error, answer) {
		if (error) {
			log.error(error);
			return process.exit(1);
		}
		if (answer === '是' || answer === 'yes' || answer === 'y') {
			callback();
			process.exit(0);
		} else if (answer === '否' || answer === 'n' || answer === 'n') {
			process.exit(0);
		} else {
			promptCert(colors.green('请输入y或者n?'), callback);
		}
	});
}

// 说明，注意不要改空格，否则输出到 控制台会变样
let out = `
  *****说明******：
	'-v' 表示版本号码
  '-t http' 开启http服务器, 此时 '-p 80' 表示http服务器端口  

  '-t https' 开启https服务器, 此时 '-p 443' 表示https服务器端口
    
  '-t all' 同时开启 https和http服务器, 此时i '-p 80,443' 表示 http,https的端口

  '-u' 表示图形操作界面端口

  '-c' 表示生成根证书，根证书在https的情况下有用，不生成无法拦截请求

  '-b' 表示破解http true表示破解，false表示不破解(注意不破解的话就不走proxy，会直接穿越到在线或者本机host配置的那个地址)，默认true, 也可以配置 host，不同的host用,分割 如： baidu.com,uc.com,test.com, 表示这些host需要破解
	'-e' 在设置拦截https的情况下，是否需要排除某些host, 不破解，多个host请以，分割, 可以使用正则, '' 重置所有列表为默认， -e优先级高于 -b
	'-s' sni 设置，该参数在将服务器当做代理使用时有效，  1表示采用nodejs的 snicallback方式（某些浏览器不支持，比如ie6，低版本androi, 默认）2 表示采用多台服务器去代理（全支持，但是性能低）
	'--autoOpen' 设置是否在启动时自动打开浏览器界面
	'--weinrePort' 表示weinre启动的端口，默认 8002
`;
let opt = {};
program
	.version(pkg.version)
	.option('-v, --version', '版本号码')
	.option('-t, --type [value]', 'http或者https服务器类型, 同时开启2种服务器用all表示', /^(http|https|all)$/i)
	.option('-p, --port [list]', '代理端口 默认  http: 80, https: 443, 多个端口用，分割第一个表示http，第二个表示https', list)
	.option('-u, --uiPort [port]', '界面端口 8001, 0表示没有后台管理界面', convertToInt)
	.option('--autoOpen [ui]', '自动打开图形界面', /^(true|false)$/)
	.option('--weinrePort [ui]', 'weinre端口', convertToInt)
	.option('-c, --cert', '生成根证书')
	.option('-b, --breakHttps [value]', '是否破解https,破解https前请先安装证书， 可以是host，多个host以 , 分割')
	.option('-e, --excludeHttps [value]', "在设置拦截https的情况下，是否需要排除某些host，多个host请以，分割, 可以使用正则, '' 重置所有列表为默认， -e优先级高于 -b")
	.option(
		'-s, --sni [value]',
		'sni 设置，该参数在将服务器当做代理使用时有效，  1表示采用nodejs的 snicallback方式（某些浏览器不支持，比如ie6，低版本androi, 默认）2 表示采用多台服务器去代理（全支持，但是性能低）',
		/^(1|2)$/i
	)
	.on('--help', () => console.log(colors.green(out)))
	.option('-l, --log [item]', '设置日志级别error, warn, info, verbose, debug, silly', /^(error|warn|info|verbose|debug|silly)$/i)
	.parse(process.argv);
// 生成证书
if (program.cert) {
	if (cert.isRootCertExits()) {
		promptCert(colors.green('已经存在根证书，是否覆盖?'), function() {
			cert.setRootCert();
		});
	} else {
		cert.setRootCert();
		process.exit(0);
	}
} else {
	configProps.forEach(current => {
		if (program[current] === true && current !== 'breakHttps' && current !== 'autoOpen') {
			program[current] = undefined;
		}
		// 已经输入变量转成小写 转换string成boolean
		if (typeof program[current] === 'string') {
			program[current] = program[current].toLowerCase();
			if (program[current] === 'true') {
				program[current] = true;
			}
			if (program[current] === 'false') {
				program[current] = false;
			}
		}

		if (program[current] !== undefined) {
			if (current === 'port') {
				if (program[current] && program[current].length) {
					opt.port = program[current][0];
					if (program[current][1]) {
						opt.httpsPort = program[current][1];
					}
				}
			} else if (current === 'weinrePort') {
				opt.weinrePort = program[current];
			} else if (current === 'uiPort') {
				opt.uiPort = program[current];
			} else if (current === 'breakHttps') {
				if (typeof program[current] === 'string') {
					opt[current] = program[current].split(',');
				} else {
					opt[current] = !!program[current];
				}
			} else if (current === 'excludeHttps') {
				if (typeof program[current] === 'string') {
					if (program[current] === '') {
						opt[current] = '';
					} else {
						opt[current] = program[current].split(',');
					}
				}
			} else if (current === 'sni') {
				opt[current] = +program[current];
			} else {
				opt[current] = program[current];
			}
		}
	});
	// catproxy main file
	var catProxy = new CatProxy(opt);
	// 初始化代理服务器
	catProxy.init();

	// catProxy.onPipeRequest(function(result) {
	// 	return new Promise(function(resolve, reject) {
	// 		setTimeout(function() {
	// 			console.log(1, result.host);
	// 			resolve(result);
	// 		}, 300);
	// 	});
	// }, function(result) {
	// 	// window.test = 3;
	// 	console.log(result.protocol);
	// }, function(result) {
	// 	return new Promise(function(resolve, reject) {
	// 		setTimeout(function() {
	// 			console.log(2, result.host);
	// 			resolve(result);
	// 		}, 300);
	// 	});
	// });
}
