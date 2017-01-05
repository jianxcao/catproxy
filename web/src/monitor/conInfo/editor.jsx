import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import merge from 'lodash/merge';
import isEmptyObject from "lodash/isEmpty";
import {shouldEqual} from '../util';
import Promise from 'promise';
const win = window;
const container = document.createElement('div');
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
var modelTimer = null;
// 全局编辑器
var editor;
const getMonaco = () => {
	return new Promise(function(resolve, reject) {
		if (win.monaco) {
			resolve(win.monaco);
		} else {
			win.require(['vs/editor/editor.main'], function() {
				resolve(win.monaco);
			});
		}
	});	
};
const getBaseEditor = () => {
	return getMonaco()
	.then(function(monaco) {
		// 内存中创建编辑器，
		// 前提是编辑器已经加载成功了
		var editor = monaco.editor.create(container, merge({
			model: null,
		}, options));		
		window.editor = editor;
		return editor;
	});
};

export default class Eidtor extends Component {
	constructor() {
		super();
		this._editorDidMount = this._editorDidMount.bind(this);
		this.resize = this.resize.bind(this);
	}
	static proptTypes = {
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
		language: "plaintext"
	}
		
	shouldComponentUpdate (nextProps, nextState) {
		// 永远不更新-- editor 自己控制
		return nextProps.editorDidMount !== this.props.editorDidMount;
	}
	componentWillReceiveProps (nextProps) {
		let {theme, data, language, opt} = this.props;
		let {theme: nextTheme, data: nextData, language: nextLanguage, opt: nextOpt} = nextProps;
		let my = {};
		// 主题变
		if (theme !== nextTheme) {
			my.theme = nextTheme;
		}
		// opt发生变化
		if (!shouldEqual(opt, nextOpt)) {
			// 更新所有字段
			my = merge({}, options, my, opt, nextOpt);
		}
		if (!isEmptyObject(my)) {
			editor.updateOptions(my);
		}
		// 内容或者 语言发生变化，重置model
		if (data !== nextData || language !== nextLanguage) {
			this._initModel(nextData, nextLanguage);
		}
	}
	componentDidMount() {
		var win = window;
		if (win.addEventListener) {
			win.addEventListener('resize', this.resize, false);
		}
		if (!editor) {
			getBaseEditor()
			.then((ed) => {
				editor = ed;
				this._editorDidMount();
			});
		} else {
			this._editorDidMount();
		}
	}
	_initModel(data = "", language) {
		// 不延迟切换编辑器的时候有可能会报错, 特别快速的切换编辑器-只保留最后一个
		modelTimer = 	setTimeout(() => {
			var oldModel = editor.getModel();
			if (oldModel) {
				oldModel.dispose();
			}
			if (modelTimer) {
				clearTimeout(modelTimer);
				modelTimer = null;
			}
			var newModel = win.monaco.editor.createModel(data, language);
			editor.setModel(newModel);
		}, 100);
	}
	_editorDidMount() {
		let {editorDidMount, data = "", language} = this.props;
		let {editorContainer} = this.refs;
		if (!language) {
			language = "plaintext";
		}
		this._initModel(data, language);
		editorContainer.appendChild(container);
		editor.layout();
		// 检测当前设置的 language, 如果language不能识别就设置成文本
		// 直接focus有问题，会导致 input框失去焦点
		// editor.focus();
		if (editorDidMount) {
			editorDidMount(editor);
		}
	}
	componentWillUnmount() {
		var win = window;
		if (win.addEventListener) {
			win.removeEventListener('resize', this.resize);
		}
		let div = document.createElement('div');
		div.appendChild(container);
		div = null;
		
	}

	resize() {
		if (editor) {
			editor.layout();
		}
	}
	
	render() {
		return (
			<div ref="editorContainer" className="editorContainer"></div>
		);
	}
}
