import React, {PropTypes} from 'react';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import AutoComplete from 'material-ui/AutoComplete';
import TextField from 'material-ui/TextField';
import { Provider,connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Immutable, {OrderedMap, Map, List} from 'immutable';
import sendMsg from '../ws/sendMsg';
import keymaster from 'keymaster';
import store from './store/store';
import Checkbox from 'material-ui/Checkbox';

keymaster.filter = (event) => {
	return true;
};
import {
	addBranch,
	addGroup,
	disableAll,
	disCache,
	cacheFlush
} from './action/actions';
var previousHosts = null;
const toobarStyle ={
	paddingLeft: 20
};
const paperStyle = {
	minWidth: "460px"
};
const checkBoxWraperStyle = {
	maxWidth: "125px"
};
const toolbarTitleStyle = {
	minWidth: "40px"
};
// 二级导航
class SubHeader extends React.Component {
	constructor(props) {
		super(props);
		this.handleCloseDialog = this.handleCloseDialog.bind(this);
		this.handleAddBranch = this.handleAddBranch.bind(this);
		this.handleGroupInput = this.handleGroupInput.bind(this);
		this.handleGroupSelect = this.handleGroupSelect.bind(this);
		this.handleEnterKeyAddBranch = this.handleEnterKeyAddBranch.bind(this);
		this.handleChangeBranch = this.handleChangeBranch.bind(this);
		this.handleOpenDialog = this.handleOpenDialog.bind(this);
		this.handleDisAll = this.handleDisAll.bind(this);
		this.handleDisCache = this.handleDisCache.bind(this);
		this.handleSaveHosts = this.handleSaveHosts.bind(this);
		this.handleCacheFlush = this.handleCacheFlush.bind(this);
		this.state = {
			openDialog: false
		};
	}
	componentDidMount() {
		keymaster('⌘+s, ctrl+s', () =>{
			this.handleSaveHosts();
			return false;
		});		
	}

	static propTypes = {
		hosts: PropTypes.object.isRequired
	}

	static contextTypes = {
		dialog: PropTypes.func.isRequired,
		toast: PropTypes.func.isRequired
	}

	static defaultProps = {
		hosts: new Map()
	}

	// 对话框相关事件
	handleCloseDialog() {
		this.setState({
			openDialog: false
		});
	}

	handleOpenDialog() {
		this.setState(Object.assign({}, this.state, {
			openDialog: true
		}));
	}

	handleChangeBranch(evt, val) {
		this.setState(Object.assign({}, this.state, {
			branchName: val
		}));	
	}

	handleGroupInput(inputVal, groups) {
		var result = groups.filter(current => current.text === inputVal);
		this.setState(Object.assign({}, this.state, {
			groupName: inputVal,
			groupId: result.length ? result[0].value : null
		}));
	}

	handleGroupSelect(val) {
		this.setState(Object.assign({}, this.state, {
			groupName: val.text,
			groupId: val.value
		}));
	}

	handleAddBranch() {
		let {groupName, branchName, groupId} = this.state;
		let {addGroup, addBranch} = this.props;
		if (groupName && branchName) {
			// groupid为null就新建分支
			addBranch(groupId, groupName, branchName);
			this.setState({
				openDialog: false
			});
		} else {
			this.context.dialog({
				msg: '分支名称和分组名称是必须得',
				layout: -1,
				btn: ["*确定"]
			});
		}
	}

	handleEnterKeyAddBranch(evt) {
		let {groupName, branchName} = this.state;
		if (groupName && branchName && evt.keyCode === 13) {
			this.handleAddBranch();
		}
	}

	// 对话框相关事件结束
	
	// 禁止全部
	handleDisAll() {
		this.props.disableAll();
	}
	// 保存hosts
	handleSaveHosts() {
		var com = this;
		var hosts = this.props.hosts;
		if (previousHosts && previousHosts.equals(hosts)) {
			return;
		}
		sendMsg.updateRule(this.props.hosts.toJS())
		.then(message => {
			com.context.toast(message.result);
			previousHosts = hosts;
		}, 
		message => com.context.toast(message.result));
	}
	// 禁止使用缓存
	handleDisCache(proxy, status) {
		var com = this;
		let {disCacheMethod} = this.props;
		disCacheMethod(status);
		sendMsg.disCache(status)
		.then(message => {
			com.context.toast(message.result);
		}, 
		message => com.context.toast(message.result));
	}
	handleCacheFlush (proxy, status) {
		var com = this;
		let {cacheFlushMethod} = this.props;
		cacheFlushMethod(status);
		sendMsg.cacheFlush(status)
		.then(message => {
			com.context.toast(message.result);
		}, 
		message => com.context.toast(message.result));
	}
	jumpMonitor () {
		window.location.href = '/c/m';
	}
	jumpHelpRule () {
		window.location.href = 'https://github.com/jianxcao/catproxy/blob/master/docs/rule.md';	
	}
	shouldComponentUpdate(nextProps, nextState) {
		return this.state.openDialog !== nextState.openDialog || this.props.disCache !== nextProps.disCache || this.props.cacheFlush !== nextProps.cacheFlush;      
	}

	renderDialog() {
		const contentStyle = {
			width: '500px',
			maxWidth: 'none',
			textAlign: 'center',
			overflow: "hidden"
		};
		const bodyStyle = {
			padding: "12px",
			minWidth: "200px"
		};
		const actions = [
			<FlatButton
				label="取消"
				primary={true}
				onTouchTap={this.handleCloseDialog}
			/>,
			<FlatButton
				label="保存"
				primary={true}
				keyboardFocused={true}
				onTouchTap={this.handleAddBranch} 
			/>
		];
		let source = this.groups = this.props.hosts.map((current, index) => {
			return {
				text: current.get('name'),
				value: index
			};
		}).toJS();
		return (<Dialog
			actions={actions}
			modal={true}
			open={this.state.openDialog}
			contentStyle={contentStyle}
			autoScrollBodyContent={true}
			bodyStyle={bodyStyle}
			>
				<AutoComplete
					floatingLabelText="分组名称"
					ref="grounEle"
					filter={AutoComplete.caseInsensitiveFilter}
					dataSource={source}
					maxSearchResults={5}
					openOnFocus={true}
					onUpdateInput = {this.handleGroupInput}
					onNewRequest={this.handleGroupSelect}
				/><br/>
				<TextField
					ref="branchEel"
					floatingLabelText="规则名称"
					type="text"
					onKeyUp = {this.handleEnterKeyAddBranch}
					onChange={this.handleChangeBranch}
				/>
		</Dialog>);
	}

	render() {
		let {cacheFlush, disCache} = this.props;
		return (
			<Paper zDepth={0} style={paperStyle}>
				<Toolbar style={toobarStyle}>
					<ToolbarGroup firstChild={false} style={{
						alignItems: "center"
					}}>
						<ToolbarTitle text="操作" style={toolbarTitleStyle}/>
						<RaisedButton label="新建" primary={true} onClick={this.handleOpenDialog}/>
						<RaisedButton label="禁用全部" primary={true} onClick={this.handleDisAll}/>
						<RaisedButton label="监控" primary={true} onClick={this.jumpMonitor}></RaisedButton>
						<Checkbox label="禁用缓存" checked={disCache} onCheck={this.handleDisCache} style={checkBoxWraperStyle}/>
						<Checkbox label="刷新缓存" checked={cacheFlush} onCheck={this.handleCacheFlush} style={checkBoxWraperStyle}/>
					</ToolbarGroup>
					<ToolbarGroup>
					<RaisedButton label="规则说明" primary={true} onClick={this.jumpHelpRule}/>
						<RaisedButton label="保存规则" primary={true} onClick={this.handleSaveHosts}/>
					</ToolbarGroup>
				</Toolbar>
				{this.renderDialog()}
			</Paper>
		);
	}
}
function mapStateToProps(state) {
	return {
		hosts: state.get('hosts'),
		disCache: state.get('disCache'),
		cacheFlush: state.get('cacheFlush')
	};
}
function mapDispatchToProps(dispatch) {
	return {
		addBranch: bindActionCreators(addBranch, dispatch),
		addGroup: bindActionCreators(addGroup, dispatch),
		disableAll: bindActionCreators(disableAll, dispatch),
		disCacheMethod: bindActionCreators(disCache, dispatch),
		cacheFlushMethod: bindActionCreators(cacheFlush, dispatch),
	};
}
export default connect(mapStateToProps, mapDispatchToProps)(SubHeader);
