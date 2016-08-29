import {ListItem} from 'material-ui/List';
import React from 'react';
import IconButton from 'material-ui/IconButton';
import EditField from './editField';
//菜单列表
const getIcon = (props = {}, className, style) => {
	let defStyle ={
		padding: "0px",
		width: 24,
		height: 24,
		fontSize: '24px',
		lineHeight: '24px',
		position: 'absolute',
		left: '0px',
		top: '12px'
	};
	let iconStyle = {
		fontSize: '16px'
	};
	style = Object.assign({}, defStyle, style);
	return 	(
		<IconButton
			{...props}
			style={style}
			iconStyle={iconStyle}
			iconClassName={"basefont " + className}
		/>
	);
};
export default class MyListItem extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hoverList: false,
			isEditor: false
		}
	}
	static propTypes = {
		 primaryText: React.PropTypes.string.isRequired
	}

	static contextTypes = {
		changeGroupName: React.PropTypes.func,
		changeBranchName: React.PropTypes.func,
		delBranch: React.PropTypes.func,
		delGroup: React.PropTypes.func,
		toggleGroupDis: React.PropTypes.func,
		toggleBranchDis: React.PropTypes.func,
		updateSelectRule: React.PropTypes.func,
		disableAll: React.PropTypes.func
	}

	static defaultProps = {
		primaryText: ""
	}
	//修改名称事件
	changeName = (newName) => {
		let {groupId, branchId, primaryText} = this.props;
		let {changeBranchName, changeGroupName} = this.context;
		//名称发生改变
		if (newName !== primaryText) {
			if (branchId !== undefined) {
				changeBranchName(groupId, branchId, newName);
			} else {
				changeGroupName(groupId, newName);
			}
		}
		this.setState(Object.assign({}, this.state, {
			isEditor: false
		}));
	}
	//删除事件
	handleDel = (e) => {
		e.stopPropagation();
		e.preventDefault();
		let {groupId, branchId} = this.props;
		let {delBranch, delGroup} = this.context;
		if (branchId >= 0 && branchId !== null) {
			delBranch(groupId, branchId);
		} else {
			delGroup(groupId);
		}
	}

	//禁止使用事件
	handleDis = (e) => {
		e.stopPropagation();
		e.preventDefault();
		let {groupId, branchId} = this.props;
		let {toggleGroupDis, toggleBranchDis} = this.context;
		if (branchId >= 0 && branchId !== null) {
			toggleBranchDis(groupId, branchId);
		} else {
			toggleGroupDis(groupId);
		}
	}

	//变成可编辑状态
	handleChangeToEditor = (e) => {
		e.stopPropagation();
		e.preventDefault();
		this.setState(Object.assign({}, this.state, {
			isEditor: true
		}));
	}

	//获取文本内容
	getPrimaryContent = ()=> {
		let isDisplay = this.state.hoverList ? "inline-block" : "none";
		return [
			getIcon({
				key: 0,
				onClick: this.handleDel.bind(this)
			},'icon-del', {
				display: isDisplay,
			}),
			getIcon({
				key: 1,
				onClick: this.handleDis.bind(this)
			},'icon-disable', {
				display: isDisplay,
				left: '24px'
			}), 
			getIcon({
				key: 2,
				onClick: this.handleChangeToEditor.bind(this)
			},'icon-editor', {
				display: isDisplay,
				left: '48px'
			}),
			<EditField val={this.props.primaryText} key={3} valChange={this.changeName.bind(this)} isEditor= {this.state.isEditor}/>];
	}

	getInnerDivStyle = () => {
		let innerDivStyle = this.props.innerDivStyle || {};
		return Object.assign({}, 	{
			padding: "0px",
			height: '48px',
			lineHeight: '48px'
		}, innerDivStyle);
	}

	handleMouseOver = () => {
		this.setState(Object.assign({}, this.state, {
			hoverList: true
		}));
	}

	handleMouseOut = () => {
		this.setState(Object.assign({}, this.state, {
			hoverList: false
		}));
	}
	//改变当前指定的分组分支
	handleUpdateSelectRule = () => {
		if (this.context.updateSelectRule) {
			let {groupId, branchId} = this.props;
			if (branchId !== null && branchId >= 0) {
				this.context.updateSelectRule(groupId, branchId);
			}
		}
	}
	//强制启用当前分支，禁止其他分支
	handleSetCurrent = () => {
		let {groupId, branchId} = this.props;
		let {disableAll, toggleBranchDis} = this.context;
		if (branchId !== null && branchId >= 0) {
			disableAll();
			toggleBranchDis(groupId, branchId, false);
		}
	}

	//所有属性雷同 material-ui/List下的 ListItem的组件
	render() {
			var myProps = Object.assign({}, this.props);
			delete myProps.groupId;
			delete myProps.branchId;
			delete myProps.changeBranch;
			return (<ListItem {...myProps}  innerDivStyle ={this.getInnerDivStyle()} onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut} onClick={this.handleUpdateSelectRule} primaryText={this.getPrimaryContent()} onDoubleClick={this.handleSetCurrent}/>
		);
	}
}
					 
