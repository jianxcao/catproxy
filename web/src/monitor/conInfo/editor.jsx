import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import MonacoEditor from './monacoEditor';
import merge from 'lodash/merge';
const config = window.config;
const requireConfig = window.requireConfig;
// 编辑器主题
const options = {
	readOnly: true,
	folding: true,
	theme: "vs",
	// 多少列后就折行, -1表示不折行
	wrappingColumn: -1,
	// 折行开始位置
	wrappingIndent: "same",
	scrollbar:{
		verticalScrollbarSize: 17,
		horizontalScrollbarSize: 17,				
		verticalSliderSize: 9,
		horizontalSliderSize:9,
		useShadows: true
	}
};
export default class Eidtor extends Component {
	constructor() {
		super();
		this._editorDidMount = this._editorDidMount.bind(this);
		this.resize = this.resize.bind(this);
	}
	static proptTypes = {
		formatCode: PropTypes.bool,
		// 主题
		theme: React.PropTypes.oneOf(['vs', 'vs-dark']),
		// 数据
		data: PropTypes.string.isRequired,
		// 当前语言
		language: PropTypes.string.isRequired,
		opt: PropTypes.object,
		editorDidMount: PropTypes.func
	}
	static defaultPorps = {
		theme: "vs",
		formatCode: false,
		language: "plaintext"
	}
	shouldComponentUpdate (nextProps, nextState) {
		return true;
	}
	
	componentDidMount() {
		var win = window;
		if (win.addEventListener) {
			win.addEventListener('resize', this.resize, false);
		}
	}

	componentWillUnmount() {
		var win = window;
		if (win.addEventListener) {
			win.removeEventListener('resize', this.resize);
		}
		if (this.editor) {
			this.editor = null;
		}
	}
	resize() {
		if (this.editor) {
			this.editor.layout();
		}
	}
	// 编辑器加载成功，获得焦点
	_editorDidMount(editor, monaco) {
		let {editorDidMount} = this.props;
		window.editor = editor;
		// 检测当前设置的 language, 如果language不能识别就设置成文本
		editor.focus();
		if (editorDidMount) {
			editorDidMount(editor);
		}
		this.editor = editor;
	}

	render() {
		let {data = "", language, opt} = this.props;
		opt = merge({}, opt, options);
		return (
			<MonacoEditor
				width="100%"
				height="100%"
				language={language}
				value={data}
				options={opt}
				editorDidMount={this._editorDidMount}
				requireConfig = {requireConfig}
			/>
		);
	}
}
