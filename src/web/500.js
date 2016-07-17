import log from '../log';
export default function(err, req, res) {
	log.error('发生错误了,', err.message);
	res.status(500);
	res.render("500", {
		message: "发生错误了," + err.message
	});
}
