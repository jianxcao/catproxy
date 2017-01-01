import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import MonacoEditor from 'react-monaco-editor';
const config = window.config;
const requireConfig = {
	url: config.cdnBasePath + "/lib/monaco-editor/vs/loader.js",
	paths: {
		'vs': config.cdnBasePath + "/lib/monaco-editor/vs"
	}	
};
export default class Eidtor extends Component {
	constructor() {
		super();
		this.editorDidMount = this.editorDidMount.bind(this);
		this._resize = this._resize.bind(this);
	}
	static proptTypes = {
		formatCode: PropTypes.bool,
		// 主题
		theme: React.PropTypes.oneOf(['vs', 'vs-dark']),
		// 数据
		data: PropTypes.string.isRequired,
		// 当前语言
		language: PropTypes.string.isRequired
	}
	static defaultPorps = {
		theme: "vs",
		formatCode: false,
		language: "plaintext"
	}
	componentWillMount() {
		var win = window;
		if (win.removeEventListener) {
			win.removeEventListener('resize', this._resize);
		}	
	}
	
	componentDidMount() {
		// var win = window;
		// if (win.addEventListener) {
		// 	win.addEventListener('resize', this._resize, false);
		// }
	}

	componentWillUnmount() {
		
	}
	_resize() {

	}
	componentWillReceiveProps(nextProps) {
		
	}

	componentWillUpdate (nextProps, nextState) {
		return true;
	}
	
	// 编辑器加载成功，获得焦点
	editorDidMount(editor, monaco) {
		window.editor = editor;
		window.monaco = monaco;
		// 检测当前设置的 language, 如果language不能识别就设置成文本
		editor.focus();
		this.editor = editor;
	}

	render() {
		const {data = "", language} = this.props;
		const options = {
			readOnly: true,
			folding: true,
			theme: "vs",
		};
		return (
			<MonacoEditor
				width="100%"
				height="100%"
				language={language}
				value={data}
				options={options}
				editorDidMount={this.editorDidMount}
				requireConfig = {requireConfig}
			/>
		);
	}
}
