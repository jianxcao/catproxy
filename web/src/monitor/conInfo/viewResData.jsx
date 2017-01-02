import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import {Provider,connect } from 'react-redux';
import {bindActionCreators} from 'redux';
import {fetchConData} from '../action/fetchAction';
import {loadingConData} from '../action/loadingAction';
import Loading from '../loading';
import cx from 'classnames';
import Immutable, {List, Map} from 'immutable';
import ResToolBar from './resToolBar';
import {jsonParse, isJSONStr} from '../util';
import JsonTreeView from './jsonTreeView';
import Editor from './editor';
import {extLanguage} from './languageHelper';
const isImage = /^image\/.+/;
class ViewResData extends Component {
	constructor() {
		super();
		this.changeJSONFormat = this.changeJSONFormat.bind(this);
		this.changeCharset = this.changeCharset.bind(this);
		this.changeFormatCode = this.changeFormatCode.bind(this);
	}
	static propTypes = {
		data: PropTypes.object.isRequired,
		sendFetchConData: PropTypes.func,
		loading: PropTypes.object,
		resBodyData: PropTypes.object
	}
	static defaultProps = {
		resBodyData: null
	}
	componentWillMount() {
		let {sendFetchConData, data} = this.props;
		let id = data.get('resBodyDataId');
		let status = data.get('status');
		this.state = {
			loading: new Map(),
			resBodyData: null,
			jsonFormat: false,
			formatCode: true
		};
		// 首次进入的时候发送请求
		// 米有id有2种情况，一种是没有数据，一种是加载还没有返回成功
		if (id) {
			this.state.loading = true;
			this.fetchData(this.state.formatCode);
		} else {
			if (!status) {
				this.state.loading = true;
			} else {
				this.state.loading = false;
			}
		}
	}
	fetchData(formatCode) {
		let {sendFetchConData, data} = this.props;
		let id = data.get('resBodyDataId');
		let ext = data.get('ext');
		// let contentType = data.getIn(['resHeaders', 'content-type']);
		sendFetchConData({
			id, 
			ext,
			formatCode
		});		
	}
	// 改变是否格式化成json树
	changeJSONFormat(isFormat) {
		this.setState({
			jsonFormat: !!isFormat
		});
	}
	// 修改编码
	changeCharset(charset) {

	}
	// 是否格式化（美化代码 仅仅js css html有用）
	changeFormatCode(formatCode) {
		this.setState({
			formatCode,
			loading: true,
			resBodyData: null,
		});
		this.fetchData(formatCode);
	}
	render() {
		let {data, resBodyData} = this.props;
		let isResinary = data.get('isResinary');
		let id = data.get('resBodyDataId');
		let ext = data.get('ext');
		let resHeaders = data.get('resHeaders');
		let defText = <span className="dataNoParse">二进制数据!!!</span>;
		let loading = this.state;
		let result = <div></div>;	
		// 数据已经单独冲后台加载成功 -- 并且就是当前打开tab得数据
		if (resBodyData && resBodyData.data && resBodyData.id && resBodyData.id === id) {
			let t = typeof resBodyData.data;
			// 二进制数据 - 看看是不是 图片如果是图片就 处理图片，否则就返回不认识
			// 不存在id表示数据没有在后天存在
			if (isResinary) {
				if (resHeaders) {
					let contentType = resHeaders.get("content-type");
					if (isImage.test(contentType)) {
						let blob = new Blob([new Int8Array(resBodyData.data)], {'type': contentType});
						let myURl = URL.createObjectURL(blob);
						result =  (
							<div className="imagePreview">
								<img src={myURl} />
							</div>
						);
					} else {
						result =  defText;
					}
				} else {
					result =  defText;
				}
			} else {
				result =  t === "string" ? this.renderResData() : defText;
			}
		} else {
			result = <Loading className="pageLoading" />;;
		}
		return result;		
	}
	renderResData() {
		let {resBodyData, data} = this.props;
		let {jsonFormat, formatCode} = this.state;
		let ext = data.get('ext');
		let language = extLanguage[ext];
		let result;
		let isLikeJSON = isJSONStr.test(resBodyData.data.trim());
		if (isLikeJSON) {
			language = "json";
		}
		if (jsonFormat) {
			try{
				let json = jsonParse(resBodyData.data);
				result = <JsonTreeView isUrlDecode={false} json={json}></JsonTreeView>;
			} catch(e) {
				console.error(e);
				result = <div>
					<span>格式化json数据出错，json数据是</span>
					<div>{resBodyData.data}</div>
				</div>;
			}
		} else {
			// 显示编辑器
			result = <Editor data={resBodyData.data} language={language}></Editor>;
		}
		return (
		<div className="codePreview">
			<ResToolBar 
				formatCode={formatCode} 
				charset={resBodyData.charset || "utf8"} 
				isJSONStr={isLikeJSON} 
				jsonFormat={jsonFormat}
				changeJSONFormat={this.changeJSONFormat}
				changeFormatCode = {this.changeFormatCode}
				changeCharset= {this.changeCharset}
				>
			</ResToolBar>
			<div className="code">{result}</div>
		</div>);		
	}
}

function mapStateToProps(state) {
	return {
		resBodyData: state.get('curConDetailData')
	};
}

function mapDispatchToProps(dispatch) {
	return {
		sendFetchConData: bindActionCreators(fetchConData, dispatch)
	};
}
export default connect(mapStateToProps, mapDispatchToProps)(ViewResData);
