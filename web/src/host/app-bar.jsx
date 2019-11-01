import React, { PropTypes } from 'react';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import { Provider, connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { drawerStatus } from './action/actions';
import UploadContent from './dragUpload';
import sendMsg from '../ws/sendMsg';
import store from './store/store';
import { resetHosts, remoteUpdateRuleUrl } from './action/actions';
import LinkItem from './LinkItem';
import TextField from 'material-ui/TextField';
import qrcode from '../lib/qrcode/qrcodeDialog';
let getIcon = (props = {}, className = '', style = {}) => {
	let defStyle = {
		padding: '0px',
	};
	let iconStyle = {
		fontSize: '24px',
	};
	style = Object.assign({}, defStyle, style);
	return <IconButton {...props} style={style} iconStyle={iconStyle} iconClassName={'basefont ' + className} />;
};

class Header extends React.Component {
	constructor(props) {
		super(props);
	}
	static propTypes = {};
	static contextTypes = {
		dialog: PropTypes.func.isRequired,
		toast: PropTypes.func.isRequired,
	};

	handleToggle = () => {
		let { drawerStatus, changeDrawerStatus } = this.props;
		changeDrawerStatus(!drawerStatus);
	};

	// 点击导入
	handleImportRule = () => {
		let { dialog, toast } = this.context;
		let reader;
		let getReader = result => {
			reader = result;
		};
		let getContent = content => {
			return <UploadContent dialog={dialog} toast={toast} getReader={getReader} content={content || ''} />;
		};
		let id = dialog({
			title: '上传配置',
			msg: getContent(),
			btn: ['取消', '确定上传'],
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
							dialog(dialogId, 'CONTENT', getContent('重新拖拽上传'));
							return false;
						}
						dialog({
							msg: '将覆盖当前的配置文件确定要这么做么',
							onBtnClick: btnId => {
								if (btnId) {
									store.dispatch(resetHosts(reader.rules));
									sendMsg.updateRule(reader.rules).then(
										message => {
											toast(message.result);
										},
										message => toast(message.result)
									);
								}
							},
						});
					} else {
						toast('请先上传文件');
					}
				} else {
					if (reader) {
						// 文件还在读，直接取消
						if (reader.readyState === reader.LOADING) {
							reader.abort();
						}
					}
					reader = null;
				}
			},
		});
	};
	// 上传远程配置文件
	handleImpRemoteRule = () => {
		let { dialog, toast } = this.context;
		let test = /^https?:\/\/.+/;
		dialog({
			title: '上传配置',
			msg: () => <TextField hintText='配置文件url' ref='url' name='url' defaultValue={this.props.remoteUpdateRuleUrl} />,
			btn: ['取消', '上传'],
			onBtnClick: function(btnId, dialogId) {
				let val = this.refs.url.input.value;
				btnId = +btnId;
				if (!btnId) {
					return true;
				}
				if (test.test(val)) {
					dialog({
						msg: '将覆盖当前的配置文件确定要这么做么',
						onBtnClick: id => {
							if (+id) {
								sendMsg.remoteUpdateRule(val).then(
									msg => {
										toast(msg.result.msg);
										// 只更新本地数据
										store.dispatch(remoteUpdateRuleUrl(val));
										store.dispatch(resetHosts(msg.result.data));
									},
									msg => toast(msg.result)
								);
							}
						},
					});
				} else {
					toast('url不符合规范');
					return false;
				}
			},
		});
	};
	// 显示证书的二维码
	handleShowCertQrcode = () => {
		let { dialog } = this.context;
		let opt = {
			text: location.protocol + '//' + location.host + '/c/downloadcert.html',
		};
		qrcode(opt);
	};
	render() {
		let host = location.protocol + '//' + location.host;
		let downloadrule = '/c/downloadrule.html';
		let downloadcert = '/c/downloadcert.html';
		return (
			<AppBar
				title='catproxy'
				onLeftIconButtonTouchTap={this.handleToggle}
				iconElementRight={
					<IconMenu
						iconButtonElement={
							<IconButton>
								<MoreVertIcon />
							</IconButton>
						}
						targetOrigin={{ horizontal: 'right', vertical: 'top' }}
						anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
					>
						<LinkItem primaryText='下载host文件' leftIcon={getIcon({}, 'icon-download')} href={downloadrule} />
						<MenuItem primaryText='上传本地host文件' leftIcon={getIcon({}, 'icon-upload')} onClick={this.handleImportRule} />
						<MenuItem primaryText='上传远程host文件' leftIcon={getIcon({}, 'icon-upload')} onClick={this.handleImpRemoteRule} />
						<MenuItem primaryText='证书二维码' leftIcon={getIcon({}, 'icon-qrcode')} onClick={this.handleShowCertQrcode} />
						<LinkItem primaryText='下载证书文件' leftIcon={getIcon({}, 'icon-download')} href={downloadcert} />
						<LinkItem primaryText='github' leftIcon={getIcon({}, 'icon-github')} href='https://github.com/jianxcao/catproxy' />
						<LinkItem primaryText='帮助' leftIcon={getIcon({}, 'icon-help')} href='https://github.com/jianxcao/catproxy' />
					</IconMenu>
				}
			/>
		);
	}
}
function mapStateToProps(state) {
	return {
		drawerStatus: state.get('drawerStatus'),
		remoteUpdateRuleUrl: state.get('remoteUpdateRuleUrl'),
	};
}
function mapDispatchToProps(dispatch) {
	return {
		changeDrawerStatus: bindActionCreators(drawerStatus, dispatch),
	};
}
export default connect(
	mapStateToProps,
	mapDispatchToProps
)(Header);
