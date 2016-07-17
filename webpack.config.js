const webpack = require('webpack');
const path = require('path');
const buildPath = path.resolve(__dirname, './web/build');
const nodeModulesPath = path.resolve(__dirname, 'node_modules');
const config = {
  // Entry points to the project
  entry: [
    path.join(__dirname, './web/src/app/app.jsx'),
  ],
  resolve: {
      extensions: ['', '.js', '.jsx']
  },
  watch: true,
  devtool: 'sourcemap',
  output: {
    path: path.resolve(buildPath, "app"), // Path of output file
    filename: 'app.js',
  },
  plugins: [
    // Enables Hot Modules Replacement
    new webpack.HotModuleReplacementPlugin(),
    // Allows error warnings but does not stop compiling.
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [
			{
				test: /(\.css)$/,
				loaders: ['style-loader', 'css-loader']
			},{
				test: /(\.less)$/,
				loaders: ['style-loader', 'css-loader', 'less-loader']
			},{
        // React-hot loader and
        test: /(\.jsx|\.js)$/, // All .js files
        loaders: ['react-hot', 'babel-loader'], // react-hot is like browser sync and babel loads jsx and es6-7
        exclude: [nodeModulesPath],
      }
    ],
  },
};
module.exports = config;
