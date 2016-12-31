import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import cx from 'classnames';
import ViewData from "./viewData";
import {getPara} from '../util';
import isEmpty from 'lodash/isEmpty';
import JsonTreeView from './jsonTreeView';
import {jsonParse, isJSONStr} from '../util';
export default class ReqData extends Component{
	constructor() {
		super();
		this._handleSourceClick = this._handleSourceClick.bind(this);
		this._handleEncodeClick = this._handleEncodeClick.bind(this);
	}
	static defaultProps = {
	}
	componentWillMount () {
		this.state = {
			// 在是url传 比如 & 相链接的时候，或者是个字符串的时候,该字段有效
			isUrlDecode: false,
			// 直接查看 返回的源文件是什么
			isSource: false
		};
	}
	_handleEncodeClick (e) {
		e.stopPropagation();
		let {isUrlDecode} = this.state;
		this.setState({
			isUrlDecode: !isUrlDecode
		});
	}
	_handleSourceClick (e) {
		e.stopPropagation();
		e.stopPropagation();
		let {isSource} = this.state;
		this.setState({
			isSource: !isSource
		});		
	}
	parse(content, contentType) {
		let queryObj = getPara(content);
		let {isUrlDecode, isSource} = this.state;
		let result;

		// xml匹配
		if (content.indexOf("<?xml") > -1) {
			return content;
		}
		// 参数不匹配 不是这种键值对的东西
		if (!isEmpty(queryObj)) {
			result = [];
			for(let key in queryObj) {
				result.push(<div key={result.length}><span>{key}:&nbsp;</span><em>{isUrlDecode ? decodeURIComponent(queryObj[key]) : queryObj[key]}</em></div>);
			}
			result.__queryString = true;
			return result;
		}
		let dConent = decodeURIComponent(content);
		if (isJSONStr.test(dConent)) {
			try {
				let js = jsonParse(dConent);
				return (<JsonTreeView json={js} isUrlDecode={isUrlDecode}/>);
				// 解析成功，加载json组件
			} catch(e) {
				console.error(e);
			}
		}
		// 解析不了，原数据返回 
		return content;
	}
	render() {
		let {header, content, expand, children, contentType, ...props} = this.props;
		let {isUrlDecode, isSource} = this.state;
		let result = [];
		let headers = [header];
		contentType = contentType || "";
		// 是否需要解码功能按钮
		let isHaveDecoder = !(contentType.indexOf('boundary=') > -1);
		headers.push(<em className="source" key= "source" onClick={this._handleSourceClick}>{isSource ? "格式化" : "源格式"}</em>);
		content = (content || "").trim();
		if (content && !isSource) {
			result = this.parse(content, contentType);
		} else {// 源文件输出，或者为空
			result = content;
		}
		if (!result) {
			result = "";
		}
		if (isHaveDecoder !== false && !isSource && result.__queryString) {
			delete result.__queryString;
			headers.push(<em className="encode" key= "encode" onClick={this._handleEncodeClick}>{isUrlDecode ? "源编码" : "解码"}</em>);
		}
		return (
			<ViewData {...props} header={headers} content={result} expand={expand}>{children}</ViewData>
		);
	};
}
