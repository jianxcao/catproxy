export default function(req, res) {
	res.status(404);
	res.render("404", {
		message: "没有找到路径, 文件路径," + req.originalUrl
	});
}
