import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import merge from 'lodash/merge';
import ViewHeader from './viewHeader';
import ReqData from './reqData';
import DargResize from './dargResize';
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
	}
	/**
	 * opt {
	 *  data: '链接数据',
	 *  style: "链接样式",
	 *  onDargResize: fun() 大小发生改变的时候的回调
	 * }
	 */
	static propTypes = {
		opt: PropTypes.object.isRequired
	};
	static defaultProps = {
		opt: {}
	}
	static contextTypes = {
		openRightMenu: PropTypes.func.isRequired,
		closeRightMenu: PropTypes.func.isRequired
	}
	
	componentWillMount () {
		let {opt:{style}} = this.props;
		if (style) {
			let width = style.width;
			let height = style.height;
			this.state = {
				width,
				height
			};
		}
	}

	updateSize(width, height) {
		let newS = {};
		if (width) {
			newS.width = +width;
		}
		if (height) {
			newS.height = +height;
		}
		this.setState(newS);
	}

	_onDargResize(dargWidth, dargHeight) {
		let {width} = this.state;
		let {opt:{onDargResize}} = this.props;
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
	_handleClose() {
		let {destory} = this.props;
		destory();
	}
	// 渲染
	render() {
		let result;
		let headers = [];
		let response = [];
		let {opt, opt: {data}} = this.props;
		let {width, height} = this.state;
		let style = merge({}, defStyle, opt.style);
		if (width) {
			style.width = width;
		}
		if (height) {
			style.height = height;
		}
		// 请求头
		let reqHeads = data.get('reqHeaders');
		// 响应头
		let resHeaders = data.get('resHeaders');
		// 请求contentType --- 什么情况下有？？ post请求，或者表单提交
		let reqContentType = reqHeads.get("content-type") || "";
		let resContentType = resHeaders.get("content-type") || "";
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
		result = (
			<div className="conInfo" style={style}>
				<DargResize onDargResize={this._onDargResize}></DargResize>
				<span className="closeBtn" onClick={this._handleClose}><em></em></span>
				<nav className="contTab">
					<span className="active">头部</span>
					<span>响应数据</span>
				</nav>
				<div className="contentTab">
					<div className="headers">{headers}</div>
					<div className="response"></div>
				</div>
			</div>);
		return result;
	}
}

export default ConInfo;
