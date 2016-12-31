import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import marked from 'marked';
import highlight from 'highlight.js';
import highlightStyle from 'highlight.js/styles/vs.css';
marked.setOptions({
	renderer: new marked.Renderer(),
	gfm: true,
	tables: true,
	breaks: false,
	pedantic: false,
	sanitize: false,
	smartLists: true,
	smartypants: false,
	highlight: function (code) {
		return highlight.highlightAuto(code).value;
	}
});
 
export default class Eidtor extends Component {
	constructor() {
		super();
	}
	static proptTypes = {
		// 主题
		theme: React.PropTypes.oneOf(['vs', 'vs-dark']),
		// 数据
		data: PropTypes.string.isRequired,
		// 当前语言
		language: PropTypes.string.isRequired
	}
	static defaultPorps = {
		theme: "vs",
		language: "plaintext"
	}
	
	componentDidMount() {
		let {data} = this.props;
		data = '``` javascript\n' + data + "\n" + '```\n';
		let ele = this.refs.code;
		let result = marked(data);
		
		console.log(result);
		ele.innerHTML = result;
	}

	componentWillReceiveProps(nextProps) {
		
	}
	
	render() {
		const {data = ""} = this.props;
		return (<div ref="code"></div>);
	}
}
