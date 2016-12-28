import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import merge from 'lodash/merge';
import ViewHeader from './viewHeader';
import ReqData from './reqData';
import DargResize from './dargResize';
import {Provider,connect } from 'react-redux';
import {bindActionCreators} from 'redux';
import {fetchConData} from '../action/fetchAction';
import {loadingConData} from '../action/loadingAction';
import Loading from '../loading';
import cx from 'classnames';
import Immutable, {List, Map} from 'immutable';
const isImage = /^image\/.+/;
const defStyle = {
	width: 600,
	height: 300,
	top: 0,
	right: 0
};
class ConInfo extends Component {
	constructor() {
		super();
		this._onDargResize = this._onDargResize.bind(this);
		this._handleClose = this._handleClose.bind(this);
		this._changeTab = this._changeTab.bind(this);
	}
	/**
	 * opt {
	 *  data: '链接数据',
	 *  style: "链接样式",
	 *  onDargResize: fun() 大小发生改变的时候的回调
	 * }
	 */
	static propTypes = {
		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired,
		onDargResize: PropTypes.func,
		data: PropTypes.object.isRequired,
		destory: PropTypes.func.isRequired,
		sendFetchConData: PropTypes.func,
		sendLoadingConData: PropTypes.func,
		// style: null,
		// className: null,
	};
	static defaultProps = {
	}
	static contextTypes = {
		openRightMenu: PropTypes.func.isRequired,
		closeRightMenu: PropTypes.func.isRequired
	}
	
	_stateSize() {
		let {width, height} = this.props;
		width = +width || defStyle.width;
		height = +height || defStyle.height;
		this.setState({
			width,
			height,
		});		
	};

	componentWillMount () {
		// 设置默认state
		this.state = {
			currentTab: 0,
			resBodyData: null,
			// 加载状态默认是一个map
			loading: new Map(),
		};
		// 设置state上的默认大小
		this._stateSize();
		let {sendFetchConData, data} = this.props;
		let id = data.get('resBodyDataId');
		// 首次进入的时候发送请求
		if (id) {
			sendFetchConData(id);
		}
	}
	componentWillReceiveProps (nextProps) {
		// 更新state上的width和height
		this._stateSize();
		let {data, sendFetchConData, sendLoadingConData, loading} = this.props;
		let loadingConData = loading.get('loadingConData');
		let newData = nextProps.data;
		let status = data.get('status');
		// 旧id
		let oldId = data.get('resBodyDataId');
		let id = newData.get('resBodyDataId');
		// 存在id，数据有 resbodyData
		if (id) {
			// 去加载数据
			// 判断当前并不是一个相同的id则直接从新加载数据
			if(id && id !== oldId ) {
				sendFetchConData(id);
			}
		} else {
			// status没有取到代表请求没有加载 完毕- 变成加载中
			if (!status) {
				if (!loadingConData) {
					sendLoadingConData(true);
				}
			} else {
				// 没有取到id, 并且当前状态是加载中，这个时候重置成 非加载中，因为不需要加载，只有有id的时候才需要加载
				if (loadingConData) {
					sendLoadingConData(false);
				}
			}
		}
	}

	shouldComponentUpdate (nextProps, nextState) {
		// let state = this.state;
		// let props = this.props;
		// return state.width !== nextState.width ||
		// 			 state.height !== nextState.height ||
		// 			 state.currentTab !== nextState.currentTab ||
		// 			 state.resBodyData !== nextState.resBodyData ||
		// 			 props.className !== props.className ||
		return true;

	}
	
	// 拖拽改变详情的大小
	_onDargResize(dargWidth, dargHeight) {
		let {width} = this.state;
		let {onDargResize} = this.props;
		width = width + dargWidth;
		let winWidth = window.innerWidth;
		if (winWidth - width > 100) {
			this.setState({
				width: width
			});
			if (onDargResize) {
				onDargResize(width);
			}
		}
	}
	// 关闭详情
	_handleClose() {
		let {destory} = this.props;
		destory();
	}
	// 详情tab切换
	_changeTab(e) {
		let target = e.currentTarget;
		let id = target.getAttribute("data-id");
		id = +id;
		if (id >= 0) {
			this.setState({
				currentTab: id
			});
		}
	}
	// 渲染头部数据
	renderHeaders () {
		let {data} = this.props;
		let headers = [];
		// 请求头
		let reqHeads = data.get('reqHeaders');
		// 响应头
		let resHeaders = data.get('resHeaders');
		let name = data.get('name') || "";

		let general = {
			"请求地址": name,
			"请求方法": data.get('method') || "",
			"请求状态": data.get('status') || "",
			"服务器地址": data.get('serverIp') || ""
		};
		let reqRuleInfo = data.get('reqRuleInfo');
		if (reqRuleInfo) {
			general["请求规则执行"] = reqRuleInfo;
		}
		// 请求概要
		headers.push(<ViewHeader header="概览" content={general} key="general"/>);
		// 请求头i
		if (reqHeads && reqHeads.size) {
			headers.push(<ViewHeader header="请求头" content={reqHeads} key="reqHeaders"/>);
		}
		// 请求相应头部
		if (resHeaders && resHeaders.size) {
			headers.push(<ViewHeader header="响应" content={resHeaders} key="resHeaders"/>);
		}
		// 请求参数
		let queryString = name.split('?')[1] || "";
		let hash = queryString.split('#');
		// 后台是取不到hash的
		queryString = hash[0];
		hash = hash[1];
		if (queryString) {
			headers.push(<ReqData header="url 参数" content={queryString} key="queryString"/>);
		}
		// 请求form参数
		let reqBodyData = data.get('reqBodyData');
		if (reqBodyData) {
			headers.push(<ReqData header="表单数据" content={reqBodyData} key="formData"/>);
		}
		return headers;
	}
	// 渲染 响应的body数据
	renderResponse() {
		let {data, resBodyData, loading} = this.props;
		let id = data.get('resBodyDataId');
		let bodyData = data.get('resBodyData');
		let isResinary = data.get('isResinary');
		let resHeaders = data.get('resHeaders');
		let loadingConData = loading.get('loadingConData');
		let body = [];
		// 这种情况可能是 文件过大，没有返回或者返回内容是空
		// bodyData肯定是个字符串
		if (bodyData !== null && bodyData !== undefined) {
			if (bodyData === '') {
				bodyData = "数据为空";
			}
			return <span className="dataNoParse">{bodyData}</span>;
		}
		let defText = "二进制数据，无法查看";
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
						return (
							<div className="imagePreview">
								<img src={myURl} />
							</div>
						);
					} else {
						return defText;
					}
				}
				return defText;
			} else {
				return t === "string" ? resBodyData.data : defText;
			}
		}
		if (loadingConData) {
			return <Loading className="pageLoading" />;
		}	
		return body;
	}
	// 渲染
	render() {
		let result;
		let {onDargResize, style} = this.props;
		let comStyle = merge({}, defStyle, style);
		let {width, height, currentTab} = this.state;
		if (width) {
			comStyle.width = width;
		}
		if (height) {
			comStyle.height = height;
		}
		result = (
			<div className="conInfo" style={comStyle}>
				<DargResize onDargResize={this._onDargResize}></DargResize>
				<span className="closeBtn" onClick={this._handleClose}><em></em></span>
				<nav className="contTab">
					<span className={cx({active: currentTab == 0})} data-id="0" onClick={this._changeTab}>头部</span>
					<span className={cx({active: currentTab == 1})} data-id="1" onClick={this._changeTab}>响应数据</span>
				</nav>
				<div className="contentTab">
					<div className={cx("headers", {active: currentTab == 0})}>{this.renderHeaders()}</div>
					<div className={cx("response", {active: currentTab == 1})}>{this.renderResponse()}</div>
				</div>
			</div>);
		return result;
	}
}

function mapStateToProps(state) {
	return {
		loading: state.get('loading'),
		resBodyData: state.get('curConDetailData')
	};
}

function mapDispatchToProps(dispatch) {
	return {
		sendLoadingConData: bindActionCreators(loadingConData, dispatch),
		sendFetchConData: bindActionCreators(fetchConData, dispatch)
	};
}
export default connect(mapStateToProps, mapDispatchToProps)(ConInfo);
