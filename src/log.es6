import winston from 'winston';
var logger = new (winston.Logger)({
	level: 'debug',
	transports: [
	  new (winston.transports.Console)(),
		// new (winston.transports.File)({ filename: 'info.log' })
	]
});
export default logger;
