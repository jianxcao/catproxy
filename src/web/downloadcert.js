import { isRootCertExits, getRootCertPath } from '../cert/cert';
export default () => (req, res, next) => {
	if (isRootCertExits()) {
		res.download(getRootCertPath());
	} else {
		next('没有根证书，请调用命令生成');
	}
};
