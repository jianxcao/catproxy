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
import {jsonParse} from '../util';
import JsonTreeView from './jsonTreeView';
import Editor from './editor';
import {extLanguage} from './languageHelper';
import {shouldEqual} from '../util';
const isImage = /^image\/.+/;
class ViewResData extends Component {
	constructor() {
		super();
		this.changeCharset = this.changeCharset.bind(this);
		this.changeFormatCode = this.changeFormatCode.bind(this);
		this.editorDidMount = this.editorDidMount.bind(this);
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
			formatCode: false,
			charset: 'utf8'
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
	componentWillReceiveProps(nextProps) {
		let {width, resBodyData} = this.props;
		let {width: w, resBodyData: nextResBodyData} = nextProps;
		if (this.editor && (width !== w || this._checkResBodyData(resBodyData, nextResBodyData))) {
			this.editor.layout();
		}
	}
	// 检测resBodyData是否发生变化
	_checkResBodyData(oldData, newData) {
		return !shouldEqual(oldData, newData);
	}
	shouldComponentUpdate(nextProps, nextState) {
		let {resBodyData, data} = this.props;
		// width不需要处理，就是width改了不需要修改子节点
		// nextResBodyData 是异步获取的，所以需要检测 nextResBodyData 的id和 nextData的id
		let {resBodyData: nextResBodyData = {}, data: nextData} = nextProps;
		let {loading, formatCode, charset} = this.state;
		let {loading: nextLoading, formatCode: nextFormatCode, charset: nextCharset} = nextState;
		return loading !== nextLoading ||
						this._checkResBodyData(resBodyData, nextResBodyData) ||
						formatCode !== nextFormatCode ||
						charset !== nextCharset ||
						(data && nextData ? !nextData.equals(data) : data !== nextData);
	}

	componentWillUnmount () {
		this.editor = null;
	}

	fetchData(formatCode) {
		let {sendFetchConData, data} = this.props;
		let id = data.get('resBodyDataId');
		let ext = data.get('ext');
		let contentType = data.getIn(['resHeaders', 'content-type']);
		sendFetchConData({
			id,
			ext,
			formatCode,
			contentType
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
	// 编辑器已经加载
	editorDidMount(editor) {
		this.editor = editor;
	}
	renderResData() {
		let {resBodyData, data} = this.props;
		let {formatCode, charset} = this.state;
		// 这个ext是根据内容修正后的ext，因为经常 有请求的ext和实际内容不同，
		// 需要修正，其次有些请求的contentType和实际内容太也不同，需要修正，这里只修正json和jsonp
		let ext = resBodyData.ext;
		let language = extLanguage[ext];
		let result = "";
		// 如果格式化代码则带换行，否则不带
		let opt = {
			wrappingColumn: formatCode ? 300: -1
		};
		// 显示编辑器
		result = <Editor data={resBodyData.data} language={language} editorDidMount={this.editorDidMount} opt={opt}></Editor>;
		return (
		<div className="codePreview">
			<ResToolBar
				formatCode={formatCode}
				charset={charset}
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
