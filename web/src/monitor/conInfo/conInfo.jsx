import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import merge from 'lodash/merge';
import ViewHeader from './viewHeader';
import ReqData from './reqData';
import DargResize from './dargResize';
import {Provider,connect } from 'react-redux';
import {bindActionCreators} from 'redux';
import {fetchConData} from '../action/fetchAction';
import Loading from '../loading';
import cx from 'classnames';
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
		destory: PropTypes.func.isRequired
	};
	static defaultProps = {
	}
	static contextTypes = {
		openRightMenu: PropTypes.func.isRequired,
		closeRightMenu: PropTypes.func.isRequired
	}
	
	componentWillMount () {
		let {width, height} = this.props;
		width = +width || defStyle.width;
		height = +height || defStyle.height;

		this.state = {
			width,
			height,
			currentTab: 0
		};
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
		let {data, sendFetchConData, resBodyData} = this.props;
		let id = data.get('resBodyDataId');
		let bodyData = data.get('resBodyData');
		let isResinary = data.get('isResinary');
		let resHeaders = data.get('resHeaders');
		let body = [];
		// 这种情况可能是 文件过大，没有返回或者返回内容是空
		// bodyData肯定是个字符串
		if (bodyData !== null && bodyData !== undefined) {
			return bodyData;
		}
		// 数据已经加载成功
		if (resBodyData) {
			// 二进制数据 - 看看是不是 图片如果是图片就 处理图片，否则就返回不认识
			// 不存在id表示数据没有在后天存在
			if (isResinary) {
				if (resHeaders) {
					let contentType = resHeaders.get("content-type");
					if (isImage.test(contentType)) {
						return "图片文件";
					}
				}
				return "二进制数据，无法查看";
			}
		}
		// 去加载数据
		if (id) {
			sendFetchConData(id);
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
		resBodyData: state.get('resBodyData')
	};
}

function mapDispatchToProps(dispatch) {
	return {
		sendFetchConData: bindActionCreators(fetchConData, dispatch)
	};
}
export default connect(mapStateToProps, mapDispatchToProps)(ConInfo);
