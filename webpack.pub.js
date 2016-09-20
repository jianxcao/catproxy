const webpack = require('webpack');
const path = require('path');
const buildPath = path.resolve(__dirname, './web/build');
const nodeModulesPath = path.resolve(__dirname, 'node_modules');
console.log(process.env.BABEL_ENV);
const config = {
		// Entry points to the project
	entry: [
		path.join(__dirname, './web/src/host/app.jsx'),
	],
	resolve: {
		extensions: ['', '.js', '.jsx']
	},
	watch: false,
	devtool: null,
	output: {
		path: path.resolve(buildPath, "app"), // Path of output file
		filename: 'app.js',
	},
	plugins: [
		new webpack.DefinePlugin({
			"process.env": {
				NODE_ENV: JSON.stringify(process.env.NODE_ENV)
			}
		}),
		new webpack.optimize.OccurrenceOrderPlugin(),
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false
			}
		})
	],
	module: {
		loaders: [{
			test: /(\.css)$/,
			loaders: ['style-loader', 'css-loader']
		}, {
			test: /(\.less)$/,
			loaders: ['style-loader', 'css-loader', 'less-loader']
		}, {
			test: /(\.jsx|\.js)$/, // All .js files
			loader: 'babel',
			exclude: [nodeModulesPath]
		}, {
			test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
			loader: 'url-loader?limit=30000&name=[name]-[hash].[ext]'
		}]
	},
};
module.exports = config;
