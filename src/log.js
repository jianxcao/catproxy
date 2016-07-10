import winston from 'winston';
var logger = new (winston.Logger)({
	transports: [
	  new (winston.transports.Console)({
			levels: winston.config.npm.levels,
			level: 'info',
			stripColors: true,
			colorize: 'all'
		}),
		// new (winston.transports.File)({ filename: 'info.log' })
	]
});
//logger.error('error');
//logger.warn('warn');
//logger.info("test");
//logger.verbose('verbose');
//logger.debug('debug');
//logger.silly('silly');
export default logger;
