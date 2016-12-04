export default (option) => {
	return (req, res, next)=> {
		if (req.url == "/" || req.url == "/index.html") {
			res.render("host/app", option);
		} else {
			next();
		}
	};
};
