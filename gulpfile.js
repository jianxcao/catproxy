"use strict";
var gulp = require('gulp');
var babel = require('gulp-babel');
var webpack = require('webpack-stream');
var plumber = require('gulp-plumber');
var fse = require('fs-extra');
var webpackCfg = require('./webpack.config');
var webpackPubCfg = require('./webpack.pub');

// 后台代码编译成es5
gulp.task('src', function() {
	return gulp.src('src/**/*.*')
	 	.pipe(plumber()) // plumber给pipe打补丁
		.pipe(babel({
			only: '*.js',
			presets: ['es2015', "stage-0"],
			plugins: ['transform-es2015-modules-commonjs']
		}))
		.pipe(gulp.dest('build'));
});


// 前端代码编译
gulp.task('webpack:watch', function() {
	return gulp.src(['web/src/host/app.jsx', 'web/src/monitor/monitor.jsx'])
		.pipe(plumber()) // plumber给pipe打补丁
		.pipe(webpack(webpackCfg))
		.pipe(gulp.dest('web/build'));
});
gulp.task('webpack:publish', function() {
	return gulp.src(['web/src/host/app.jsx', 'web/src/monitor/monitor.jsx'])
		.pipe(webpack(webpackPubCfg))
		.pipe(gulp.dest('web/build'));
});

gulp.task('web-dest', function() {
	return gulp.src('web/src/**/+(*.html|*.ejs|*.css|*.eot|*.svg|*.ttf|*.woff)')
		.pipe(gulp.dest('web/build'));
});
gulp.task('monaco-editor-dest', function() {
	return gulp.src('node_modules/monaco-editor/min/vs/**/*')
		.pipe(gulp.dest('web/build/lib/monaco-editor/vs'));
});

// 监控
gulp.task('watch', function() {
	gulp.watch('web/src/**/*.*', ['web-dest']);
	gulp.watch('./src/**/*.*', ['src']);
});

gulp.task('clean', function(cb) {
	fse.emptyDirSync('./build');
	fse.emptyDirSync('./web/build');
	cb();
});

// 编译文件
gulp.task('publish', ["clean", "src", 'web-dest', 'monaco-editor-dest', 'webpack:publish']);

gulp.task('build', ["src", 'web-dest', 'monaco-editor-dest', 'webpack:watch', "watch"]);

process.on('uncaughtException', function(err) {
	console.log(err);
});
