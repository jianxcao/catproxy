import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import {md} from 'node-forge';
import log from '../log';
import {createRootCert, createSelfCert} from './createCert';
var certDir = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library/Preferences') : '/var/local');
		certDir = path.join(certDir, './cert_center');
var rootKeyPath = path.resolve(certDir, './cert.key');
var rootCrtPath = path.resolve(certDir, './cert.crt');
var certCachePath = path.resolve(certDir, 'certCache');

// console.log(log);
//是否纯在根证书
var isRootCertExits = () => {
	return !!(fs.existsSync(certDir) && fs.existsSync(rootKeyPath) && fs.existsSync(rootCrtPath));
};
//不存在根证书就创建
var getRootCert = () => {
	var privateKey, cert;
	//确保证书目录存在
	fse.ensureDirSync(certDir);
	if (!isRootCertExits()) {
		log.info('根证书生成目录: ' + certDir);
		var result = createRootCert();
		privateKey = result.privateKey;
		cert = result.cert;
		fs.writeFileSync(rootKeyPath, privateKey);
		fs.writeFileSync(rootCrtPath, cert);
	} else {
		privateKey = fs.readFileSync(rootKeyPath, {encoding: 'utf8'});
		cert = fs.readFileSync(rootCrtPath, {encoding: 'utf8'});
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
	return {cert, privateKey};
};

// 删除证书目录
var emptyCertDir = () => {
	fse.emptyDirSync(certDir);
};

var setCertPath = (path) => {
	if (!path) {return;}
	fse.ensureDirSync(path);
	certDir = path;
	rootKeyPath = path.resolve(certDir, './cert.key');
	rootCrtPath = path.resolve(certDir, './cert.crt');
	certCachePath = path.resolve(certDir, 'certCache');
};
var getCertPath = () => certDir;
//getCert('lmlc.com');
// emptyCertDir();
export {
	isRootCertExits,
	setCertPath,
	getCertPath,
	emptyCertDir,
	getCert,
	getRootCert
};
