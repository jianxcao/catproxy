import React,{PropTypes} from 'react';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import { Provider,connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {drawerStatus} from './action/actions';
import UploadContent from './dragUpload'
import sendMsg from './ws/sendMsg'
import store from './store/store';
import {resetHosts} from './action/actions';
class Header extends React.Component {
	constructor(props) {
		super(props)
	}
	static propTypes = {
	    
	}
	static contextTypes = {
		dialog: PropTypes.func.isRequired,
		toast: PropTypes.func.isRequired
	}

	handleToggle = () => {
		let {drawerStatus, changeDrawerStatus} = this.props;
		changeDrawerStatus(!drawerStatus);
	}
	//点击下载
	handleDownload = () => {

	}
	//点击导入
	handleImport = () => {
		let {dialog, toast} = this.context;
		let reader;
		let getReader = (result) => {
			reader = result;
		};
		let getContent = (content) => {
			return <UploadContent dialog={dialog} toast={toast} getReader={getReader} content = {content || ""}/>
		};
		let id = dialog({
			title: "上传配置",
			msg: getContent(),
			btn: ["取消", "确定上传"],
			onBtnClick: function(btnId, dialogId) {
				btnId = +btnId;
				// DONE:2
				// EMPTY:0
				// LOADING:1
				if (btnId) {
					if (reader) {
						if (reader.readyState === reader.LOADING) {
							toast('文件读取中，请稍后');
							return false;
						}
						if (!reader.rules) {
							toast('文件上传失败，或者文件解析失败，请重新上传');
							dialog(dialogId, "CONTENT", getContent('重新拖拽上传'));
							return false;
						}
						dialog({
							msg: '将覆盖当前的配置文件确定要这么做么',
							onBtnClick: (btnId) => {
								if (btnId) {
									store.dispatch(resetHosts(reader.rules));
									sendMsg.updateRule(reader.rules)
									.then(message => {
										toast(message.result);
									}, 
									message => com.context.toast(message.result))
								}
							}
						})
					} else {
						toast('请先上传文件');
					}
				} else {
					if (reader) {
						//文件还在读，直接取消
						if (reader.readyState === reader.LOADING) {
							reader.abort();
						}
					}
					reader = null;
				}
			}
		});
	}

	render() {
		return (<AppBar
		title="catproxy"
		onLeftIconButtonTouchTap = {this.handleToggle}
		iconElementRight={
					<IconMenu
						iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
						targetOrigin={{horizontal: 'right', vertical: 'top'}}
						anchorOrigin={{horizontal: 'right', vertical: 'top'}}>
						<MenuItem primaryText="下载host文件" onClick={this.handleDownload}/>
						<MenuItem primaryText="导入host文件" onClick={this.handleImport}/>
						<MenuItem primaryText="帮助" />
					</IconMenu>
		}/>)
	}
}
function mapStateToProps(state) {
	return {
		drawerStatus: state.get('drawerStatus')
	}
}
function mapDispatchToProps(dispatch) {
	return {
		changeDrawerStatus: bindActionCreators(drawerStatus, dispatch)
	};
}
export default connect(mapStateToProps, mapDispatchToProps)(Header);
