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
			hoverList: false
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
		updateSelectRule: React.PropTypes.func
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
			<EditField val={this.props.primaryText} key={2} valChange={this.changeName.bind(this)}/>];
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
		this.setState({
			hoverList: true
		});
	}
	handleMouseOut = () => {
		this.setState({
			hoverList: false
		});
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
	
	//所有属性雷同 material-ui/List下的 ListItem的组件
	render() {
			var myProps = Object.assign({}, this.props);
			delete myProps.groupId;
			delete myProps.branchId;
			delete myProps.changeBranch;
			return (<ListItem {...myProps}  innerDivStyle ={this.getInnerDivStyle()} onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut} onClick={this.handleUpdateSelectRule} primaryText={this.getPrimaryContent()}/>
		);
	}
}
					 
