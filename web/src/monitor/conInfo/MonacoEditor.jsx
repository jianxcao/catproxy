import React, { PropTypes } from 'react';

function noop() {}

class MonacoEditor extends React.Component {
	constructor(props) {
		super(props);
		this.__current_value = props.value;
	}
	componentDidMount() {
		this.initMonaco();
	}
	componentWillUnmount() {
		this.destroyMonaco();
	}
	componentWillUpdate(nextProps) {
		if (nextProps.value !== this.__current_value) {
			this.__prevent_trigger_change_event = true;
			this.editor.setValue(nextProps.value);
			this.__prevent_trigger_change_event = false;
		}
	}
	// shouldComponentUpdate (nextProps, nextState) {
	// 	// let {width, height, value, defaultValue, language, theme, options, editorDidMount, editorWillMount, onChange, requireConfig};
	// 	return true;
	// }
	
	editorWillMount(monaco) {
		const { editorWillMount } = this.props;
		editorWillMount(monaco);
	}
	editorDidMount(editor, monaco) {
		const { editorDidMount, onChange } = this.props;
		editorDidMount(editor, monaco);
		editor.onDidChangeModelContent(event => {
			const value = editor.getValue();
			// Always refer to the latest value
			this.__current_value = value;
			// Only invoking when user input changed
			if (!this.__prevent_trigger_change_event) {
				onChange(value, event);
			}
		});
	}
	initMonaco() {
		const value = this.props.value !== null ? this.props.value : this.props.defaultValue;
		const { language, theme, options } = this.props;
		const containerElement = this.refs.container;
		const context = this.props.context || window;
		if (typeof context.monaco !== 'undefined') {
			// Before initializing monaco editor
			this.editorWillMount(context.monaco);
			this.editor = context.monaco.editor.create(containerElement, {
				value,
				language,
				theme,
				...options,
			});
			// After initializing monaco editor
			this.editorDidMount(this.editor, context.monaco);
		}
	}
	destroyMonaco() {
		if (typeof this.editor !== 'undefined') {
			let {containerElement} = this.refs;
			if (containerElement) {
				let div = document.createElement(div);
				div.appendChild(containerElement);
				// 设置延迟删除，否则 MonacoEditor会报错
				window.setTimeout(() => {
					let model = this.editor.getModel();
					model.setValue("");
					if (model) {
						model.dispose();
					}
					this.editor.dispose();
					div = null;
				}, 16);
			}
		}
	}
	render() {
		const { width, height } = this.props;
		const fixedWidth = width.toString().indexOf('%') !== -1 ? width : `${width}px`;
		const fixedHeight = height.toString().indexOf('%') !== -1 ? height : `${height}px`;
		const style = {
			width: fixedWidth,
			height: fixedHeight,
		};
		return (
			<div ref="container" style={style} className="react-monaco-editor-container"></div>
		);
	}
}

MonacoEditor.propTypes = {
	width: PropTypes.oneOfType([
		React.PropTypes.string,
		React.PropTypes.number,
	]),
	height: PropTypes.oneOfType([
		React.PropTypes.string,
		React.PropTypes.number,
	]),
	value: PropTypes.string,
	defaultValue: PropTypes.string,
	language: PropTypes.string,
	theme: PropTypes.string,
	options: PropTypes.object,
	editorDidMount: PropTypes.func,
	editorWillMount: PropTypes.func,
	onChange: PropTypes.func,
	requireConfig: PropTypes.object,
};

MonacoEditor.defaultProps = {
	width: '100%',
	height: '100%',
	value: null,
	defaultValue: '',
	language: "plaintext",
	theme: 'vs',
	options: {},
	editorDidMount: noop,
	editorWillMount: noop,
	onChange: noop
};

export default MonacoEditor;
