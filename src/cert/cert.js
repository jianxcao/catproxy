import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import {md} from 'node-forge';
import log from '../log';
import {createRootCert, createSelfCert} from './createCert';
var certDir = process.env.APPDATA;

if (!certDir || certDir === 'undefined') {
	certDir = (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library/Preferences') : '/var/local');
}
certDir = path.join(certDir, './cert_center');

var rootKeyPath = path.resolve(certDir, './cert.key');
var rootCrtPath = path.resolve(certDir, './cert.crt');
var certCachePath = path.resolve(certDir, 'certCache');
var certCache = {};
// console.log(log);
log.debug(certDir);
//是否纯在根证书
var isRootCertExits = () => {
	return !!(fs.existsSync(certDir) && fs.existsSync(rootKeyPath) && fs.existsSync(rootCrtPath));
};

var setRootCert = () => {
	fse.ensureDirSync(certDir);
	log.info('根证书生成目录: ' + certDir);
	var result = createRootCert();
	let privateKey = result.privateKey;
	let cert = result.cert;
	fs.writeFileSync(rootKeyPath, privateKey);
	fs.writeFileSync(rootCrtPath, cert);
	return {
		privateKey,
		cert
	};
};

//不存在根证书就创建
var getRootCert = () => {
	var privateKey, cert;
	//存在缓存，直接调用
	if (certCache.root) {
		return certCache.root;
	}
	//确保证书目录存在
	fse.ensureDirSync(certDir);
	if (!isRootCertExits()) {
		log.error('没有生成根证书，请调用命令生成根证书 -h查看帮助');
		process.exit(0);
	} else {
		privateKey = fs.readFileSync(rootKeyPath, {encoding: 'utf8'});
		cert = fs.readFileSync(rootCrtPath, {encoding: 'utf8'});
		certCache.root = {privateKey, cert};
	}
	return {privateKey, cert};
};


//证书是否存在
var isCertExits = (keyPath, crtPath) => {
	return fs.existsSync(keyPath) && fs.existsSync(crtPath);
};
//获取证书
var getCert = (domain) => {
	var result = {};
	if (!domain) {
		return result;
	}
	//已经存在，则从缓存中获取
	if (certCache[domain]) {
		return certCache[domain];
	}
	var mc = md.md5.create();
	mc.update(domain);
	var domainMd5 = mc.digest().toHex();
	var keyPath = path.join(certCachePath, domainMd5 + ".key");
	var certPath = path.join(certCachePath, domainMd5 + ".crt");
	var cert, privateKey;
	if (isCertExits(keyPath, certPath)) {
		privateKey = fs.readFileSync(keyPath, {encoding: 'utf8'});
		cert = fs.readFileSync(certPath, {encoding: 'utf8'});
	} else {
		({cert, privateKey} = createSelfCert(domain, getRootCert()));
		fse.ensureDirSync(certCachePath);
		fs.writeFileSync(keyPath, privateKey);
		fs.writeFileSync(certPath, cert);		
	}
	certCache[domain] = {cert, privateKey};
	return {cert, privateKey};
};

// 删除证书目录
var emptyCertDir = () => {
	fse.emptyDirSync(certDir);
};

var setCertDir = (path) => {
	if (!path) {return;}
	fse.ensureDirSync(path);
	certDir = path;
	rootKeyPath = path.resolve(certDir, './cert.key');
	rootCrtPath = path.resolve(certDir, './cert.crt');
	certCachePath = path.resolve(certDir, 'certCache');
};
var getCertDir = () => certDir;
var getRootCertPath = () => rootCrtPath;
//getCert('lmlc.com');
// emptyCertDir();
export {
	isRootCertExits,
	setRootCert,
	setCertDir,
	getCertDir,
	getRootCertPath,
	emptyCertDir,
	getCert,
	getRootCert
};
