import ReactDom, {render} from 'react-dom';
import React, {PropTypes, Component} from 'react';
import {Navbar, Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap';
import {Provider,connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import navAction from './action/navAction';
import navReducer from './reducers/nav';
import {clearMonitorList} from './action/monitorListAction';
import reduce from 'lodash/reduce';
import {upperFirstLetter} from './util';
import cs from 'classnames';
import * as sendMsg from "../ws/sendMsg";
import keymaster from 'keymaster';
import shallowCompare from 'react-addons-shallow-compare'; // ES6
keymaster.filter = (event) => {
	return true;
};
class MyNav extends Component{
	static propTypes = {
		monitorStatus: PropTypes.bool.isRequired,
		monitorFilterStatus: PropTypes.bool.isRequired,
		disCache: PropTypes.bool.isRequired,
		sendMonitorStatus: PropTypes.func.isRequired,
		sendMonitorFilterStatus: PropTypes.func.isRequired,
		sendDisCache: PropTypes.func.isRequired,
		sendClearMonitorList: PropTypes.func.isRequired
	}
	constructor(...arg) {
		super(...arg);
		this.changeMonitorStatus = this.changeMonitorStatus.bind(this);
		this.clearMonitorList = this.clearMonitorList.bind(this);
		this.changeMonitorFilterStatus = this.changeMonitorFilterStatus.bind(this);
		this.changeDisCache = this.changeDisCache.bind(this);
	}
	static contextTypes = {
	}
	shouldComponentUpdate (nextProps, nextState) {
		return shallowCompare(this, nextProps, nextState);
	}
	
	componentDidMount () {
		// 清除快捷
		keymaster('⌘+k,ctrl+k', () =>{
			let {sendClearMonitorList} = this.props;
			sendClearMonitorList();
			return false;
		});	
		// 停止 启动  快捷
		keymaster('⌘+e,ctrl+e', () =>{
			let {monitorStatus, sendMonitorStatus} = this.props;
			sendMonitorStatus(!monitorStatus);
			return false;
		});	
	}
	componentWillUnmount () {
		// 清除快捷
		keymaster.unbind('⌘+k,ctrl+k');	
		// 停止 启动  快捷
		keymaster.unbind('⌘+e,ctrl+e');			
	}
	
	// 切换当前的监听状态
	changeMonitorStatus (e) {
		let {sendMonitorStatus, monitorStatus} = this.props;
		sendMonitorStatus(!monitorStatus);
		// 直接保存后台
		sendMsg.monitorStatus(!monitorStatus)
		.then(null, (err) => console.log(err));
	}
	// 清除掉所有得监控数据
	clearMonitorList(e) {
		let {sendClearMonitorList} = this.props;
		sendClearMonitorList();
	}
	// 切换下边的 条件选择的现实隐藏
	changeMonitorFilterStatus(e) {
		let {sendMonitorFilterStatus, monitorFilterStatus} = this.props;
		sendMonitorFilterStatus(!monitorFilterStatus);
		// 后台保存
		sendMsg.monitorFilterStatus(!monitorFilterStatus)
		.then(null, (err) => console.log(err));
	}
	// 切换 缓存
	changeDisCache(e) {
		let {sendDisCache, disCache} = this.props;
		sendDisCache(!disCache);
		// 后台保存
		sendMsg.disCache(!disCache)
		.then(null, (err) => console.log(err));
	}
	render() {
		let pageUrl = window.config.host + "/m";
		let {disCache, monitorStatus, monitorFilterStatus} = this.props;
		const recordCls = cs('navBtn', 'record', {disable: !monitorStatus});
		const recordTip = monitorStatus ? "点击停止监听" : "点击开始监听";
		const toolbarTip = monitorFilterStatus ? "点击隐藏过滤" : "点击现实过滤";
		const toobarCls = cs('navBtn', 'filter', {disable: !monitorFilterStatus});
		return (
			<Navbar>
				<Navbar.Header>
					<Navbar.Brand>
						<a href={pageUrl}>catproxy</a>
					</Navbar.Brand>
				</Navbar.Header>
				<Nav>
					<NavItem eventKey={"record"} href="javascript:;" className={recordCls} data-tip={recordTip + " Ctrl+e ⌘+e"} onClick={this.changeMonitorStatus}></NavItem>
					<NavItem eventKey={"clear"} href="javascript:;" className="navBtn clear" data-tip="清除全部 Ctrl+K ⌘+K" onClick={this.clearMonitorList}></NavItem>
					<NavItem eventKey={"clear"} href="javascript:;" className="split"></NavItem>
					<NavItem eventKey={"toolbar"} href="javascript:;" className={toobarCls} title="显示隐藏过滤" onClick={this.changeMonitorFilterStatus}></NavItem>
				</Nav>
				<div className="split"></div>
				<div className="selfNav">
					<span className="disCache">
						<input type="checkbox"
							checked={disCache} 
							onChange={this.changeDisCache} id="disCache"/><label htmlFor="disCache">禁止缓存</label></span>
					<div className="split"></div>
				</div>
				<Nav>
					<NavDropdown eventKey={"Dropdown"} title="证书" id="certMenu">
						<MenuItem eventKey={3.1}>下载证书</MenuItem>
						<MenuItem eventKey={3.2}>证书二维码</MenuItem>
					</NavDropdown>
					<NavItem eventKey={"clear"} href="javascript:;" className="split"></NavItem>
					<NavDropdown eventKey={"Dropdown"} title="帮助" id="helpMenu">
						<MenuItem eventKey={3.1} href="https://github.com/jianxcao/catproxy" target="_blank">github</MenuItem>
						<MenuItem eventKey={3.2} href="https://github.com/jianxcao/catproxy" target="_blank">帮助</MenuItem>
					</NavDropdown>
				</Nav>
		</Navbar>);
	}
}
function mapStateToProps(state) {
	return reduce(navReducer, (result, current, key) => {
		result[key] = state.get(key);
		return result;
	}, {});
}
function mapDispatchToProps(dispatch) {
	return reduce(navAction, (result, current, key) => {
		result["send" + upperFirstLetter(key)] = bindActionCreators(current, dispatch);
		return result;
	}, {
		sendClearMonitorList: bindActionCreators(clearMonitorList, dispatch)
	});
};
export default connect(mapStateToProps, mapDispatchToProps)(MyNav);
