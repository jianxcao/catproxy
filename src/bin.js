import program from 'commander';
import pkg from '../package.json';
import prompt from 'prompt';
import colors from 'colors';
import * as cert from './cert/cert';
import configInit from './config/config';
import CatProxy from './app';
import fse from 'fs-extra';
import log from './log';
//将字段变成list
let numReg = /^([0-9]){2,}$/;
let list = (val) => {
	val = val.split(',');
	val = val.filter(current => {
		return numReg.test(current);
	});
	return val.length ? val : undefined;
};
//说明，注意不要改空格，否则输出到 控制台会变样
let out = `
  *****说明******：
  '-t http' 开启http服务器, 此时 '-p 80' 表示http服务器端口  

  '-t https' 开启https服务器, 此时 '-p 443' 表示https服务器端口
    
  '-t all' 同时开启 https和http服务器, 此时i '-p 80,443' 表示 http,https的端口

  '-u' 表示图形操作界面端口

  '-c' 表示生成根证书，根证书在https的情况下有用，不生成无法拦截请求
`;
let opt = {};
program
	.version(pkg.version)
	.option('-v, --version', '版本号码')
	.option('-t, --type [value]', 'http或者https服务器类型, 同时开启2种服务器用all表示', /^(http|https|all)$/i)
	.option('-p, --port [list]', '代理端口 默认  http: 80, https: 443, 多个端口用，分割第一个表示http，第二个表示https', list)
	.option('-u, --ui [port]' , '界面端口 8001', parseInt)
	.option('-c, --cert', '生成根证书')
	.on('--help', () => console.log(colors.green(out)))
	.option('-l, --log [item]', 
		'设置日志级别error, warn, info, verbose, debug, silly', 
		/^(error|warn|info|verbose|debug|silly)$/i)
	.parse(process.argv);

['type','port','ui','log'].forEach((current) => {
	if (program[current] === true) {
		program[current] = undefined;
	}
	//已经输入变量转成小写
	if (typeof program[current] === 'string') {
		program[current] = program[current].toLowerCase();
	}
	if (program[current] !== undefined) {
		if (current === 'port' && program[current] && program[current].length) {
			opt.port = program[current][0];
			if (program[current][1]) {
				opt.httpsPort = program[current][1];
			}
		} else if (current === 'ui') {
			opt.uiPort = program[current];
		} else {
			opt[current] = program[current];
		}
	}
});
//生成证书
if (program.cert) {
	if (cert.isRootCertExits()) {
		prompt.start({noHandleSIGINT: true});
		prompt.get({
			properties: {
				isOverride: {
					type: 'string',
					required: true,
					message: '请输入 y 或者 n',
					description: colors.green("已经存在跟证书，是否覆盖?"),
					conform: (val)=> {
						return val === 'yes' || val === 'no' || val === 'n' || val === 'y';
					}
				}
			}
		}, function (err, result) {
			if (err) {
				process.exit(1);
			} else {
				if (result.isOverride === 'yes' || result.isOverride === 'y') {
					cert.setRootCert();
				}
				process.exit(0);
			}
		});
	} else {
		cert.setRootCert();
		process.exit(0);
	}
} else {
	configInit();
	let certDir = cert.getCertDir();
	log.info(`当前证书目录： ${certDir}`);
	// catproxy main file
	var catProxy = new CatProxy(opt);
	//初始化代理服务器
	catProxy.init();
}
