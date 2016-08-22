import {pki, md} from 'node-forge';
let attrs  = [{
  name: 'countryName',
  value: 'CN'
}, {
  shortName: 'ST',
  value: 'CP'
}, {
  name: 'localityName',
  value: 'BJ'
}, {
  name: 'organizationName',
  value: 'catproxy'
}, {
  shortName: 'OU',
  value: 'CP'
}];
let rootAttrs = attrs.slice(0);
rootAttrs.push({
	name: 'commonName',
	value: 'catproxy'
});


let createKeyandCert = ()=> {
	// generate a keypair and create an X.509v3 certificate
	let keys = pki.rsa.generateKeyPair(1024);
	let cert = pki.createCertificate();
	let today = new Date().getTime();
	let tenYearMin = 10 * 365 * 24 * 60 * 60 * 1000;
	cert.publicKey = keys.publicKey;
	cert.serialNumber = "" + new Date().getTime();
	cert.validity.notBefore = new Date(today - tenYearMin);
	cert.validity.notAfter = new Date(today + tenYearMin);
	return {cert, keys};
};

let createRootCert = () => {
	let {cert, keys} = createKeyandCert();
  cert.setSubject(rootAttrs);
	//alternatively set subject from a csr
	//cert.setSubject(csr.subject.attributes);
	cert.setIssuer(rootAttrs);
	cert.setExtensions([{
	  name: 'basicConstraints',
	  cA: true
	}]);
	cert.sign(keys.privateKey, md.sha256.create());
	// console.log(cert.subject.attributes);
	return {
		cert: pki.certificateToPem(cert),
		privateKey: pki.privateKeyToPem(keys.privateKey),
		publicKey: pki.publicKeyToPem(keys.publicKey),
	};
};

let createSelfCert = (domain, rootOpt) => {
	if (!domain) {
		return {};
	}
	let rootKey = pki.privateKeyFromPem(rootOpt.privateKey);
	let {cert, keys} = createKeyandCert();
	//rootCert.subject.attributes
	cert.setIssuer(rootAttrs);
	cert.setSubject(attrs.concat([{
		name: 'commonName',
		value: domain
	}]));
	cert.setExtensions([{
	  name: 'basicConstraints',
	  cA: true
	}]);
	cert.sign(rootKey, md.sha256.create());
	return {
		cert: pki.certificateToPem(cert),
		privateKey: pki.privateKeyToPem(keys.privateKey),
		publicKey: pki.publicKeyToPem(keys.publicKey),
	};
};

export {createRootCert, createSelfCert};
