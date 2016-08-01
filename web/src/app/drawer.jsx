import React, {PropTypes} from 'react';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/Subheader';
import Subheader from 'material-ui/Subheader';
import typography from 'material-ui/styles/typography';
import { Provider,connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import dragCon from './dragConnect';

import {
	drawerStatus,
	delBranch,
	delGroup,
	changeGroupName,
	changeBranchName,
	toggleGroupDis,
	toggleBranchDis,
	toggleFlod,
	switchBranch,
	switchGroup
} from './action/actions';
import {List} from 'material-ui/List';
import ListItem from './listItem';

const minWinWidth = 1000;

let getListItemStyles = () => {
	return {
		innerDiv: {
			display: "inline-block",
			position: 'relative'
		}
	}
};

//获取菜单头样式
let getLitTitleStyles = (props, context) => {
		let muiTheme = context.muiTheme;
		let {palette, spacing} = muiTheme;
		return {
			header: {
				backgroundColor: palette.primary1Color,
				color: palette.alternateTextColor,
				height: spacing.desktopKeylineIncrement,
				lineHeight: spacing.desktopKeylineIncrement + "px",
				titleFontWeight: typography.fontWeightMedium,
				paddingLeft: spacing.desktopGutter,
				fontSize: "24px"
			}
		}
};

class LeftDrawer extends React.Component {
	static contextTypes = {
		muiTheme: PropTypes.object.isRequired
	}
	static childContextTypes = {
		delBranch: React.PropTypes.func,
		delGroup: React.PropTypes.func,
		changeGroupName: React.PropTypes.func,
		changeBranchName: React.PropTypes.func,
		toggleGroupDis: React.PropTypes.func,
		toggleBranchDis: React.PropTypes.func
	}
	componentDidMount() {
		let {changeDrawerStatus} = this.props;
		let timer = null;
		changeDrawerStatus(!(document.documentElement.clientWidth < minWinWidth));
		window.addEventListener("resize", (evt) => {
			window.clearTimeout(timer);
			timer = window.setTimeout(()=> {
				let status = !(document.documentElement.clientWidth < minWinWidth);
				changeDrawerStatus(status);
			}, 300);
		}, false);
	}

	getChildContext() {
		let {
			delGroup,
			delBranch,
			changeGroupName,
			changeBranchName,
			toggleGroupDis,
			toggleBranchDis
		} = this.props;
		return {
			delGroup,
			delBranch,
			changeGroupName,
			changeBranchName,
			toggleGroupDis,
			toggleBranchDis
		}
	}

	//切换菜单显示隐藏
	handleToggleDrawer = () => {
		let {drawerStatus, changeDrawerStatus} = this.props;
		changeDrawerStatus(!drawerStatus);
	}

	handleExchangePos = (dragEle, dropEle) => {
		let sourceGroupId = dragEle.getAttribute('data-group-id');
		let sourceBranchId = dragEle.getAttribute('data-branch-id');
		let groupId = dropEle.getAttribute('data-group-id');
		let branchId = dropEle.getAttribute('data-branch-id');
		let {switchBranch, switchGroup} = this.props;
		sourceGroupId = sourceGroupId ? +sourceGroupId : undefined;
		sourceBranchId = sourceBranchId ? +sourceBranchId : undefined;
		groupId = groupId ? +groupId : undefined;
		branchId = branchId ? +branchId : undefined;
		if (!(groupId >= 0 && sourceGroupId >= 0)) {
			return;
		}
		if (branchId >= 0 && sourceBranchId >= 0) {
			switchBranch(groupId, sourceBranchId, branchId);
		} else {
			switchGroup(sourceGroupId, groupId);
		}
	}

	//渲染分支
	renderBranch(list, groupId) {
		let result = [];
		if (list && list.size > 0) {
			let dragProps = dragCon(this.handleExchangePos.bind(this));
			for(let key = 0, size = list.size; key < size; key ++) {
				let current = list.get(key);
				let props = {
					primaryText: current.get('name'),
					key,
					['data-group-id']: groupId,
					groupId: groupId,
					branchId: key,
					['data-branch-id']: key,
					innerDivStyle: {
						color: current.get('disable') ? "#999999" : "#333333"
					}
				}
				props = Object.assign({}, props, dragProps);
				result.push(<ListItem {...props}/>)
			}
		}
		return result;
	}

	//渲染列表
	renderList() {
		var hosts = this.props.hosts;
		var listItem = [];
		if (hosts) {
			let dragProps = dragCon(this.handleExchangePos.bind(this));
			for(let key = 0, size = hosts.size; key < size; key++) {
				let current = hosts.get(key);
				let props = {
					primaryText: current.get('name'),
					key,
					groupId: key,
					['data-group-id']: key,
					innerDivStyle: {
						color: current.get('disable') ? "#999999" : "#333333"
					},
					onNestedListToggle: ()=> {
						let {toggleFlod} = this.props;
						toggleFlod(key);
					},
					initiallyOpen: current.get('isOpen'),
					nestedItems: this.renderBranch(current.get('branch'), key)
				}
				//初始化
				props = Object.assign({}, props, dragProps);
				listItem.push(<ListItem {...props}></ListItem>)
			}
		}
		return (<List>{listItem}</List>)
	}

	render() {
		return (
			<div style={{overflow: "auto"}}>
				<Drawer width={300} open={this.props.drawerStatus}>
					<Subheader inset={true} style={getLitTitleStyles(this.props, this.context).header} onClick={this.handleToggleDrawer}>catproxy</Subheader>
					{this.renderList()}
				</Drawer>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		drawerStatus: state.get('drawerStatus'),
		hosts: state.get('hosts')
	}
}

function mapDispatchToProps(dispatch) {
	return {
		changeDrawerStatus: bindActionCreators(drawerStatus, dispatch),
		delBranch: bindActionCreators(delBranch, dispatch),
		delGroup: bindActionCreators(delGroup, dispatch),
		changeGroupName: bindActionCreators(changeGroupName, dispatch),
		changeBranchName: bindActionCreators(changeBranchName, dispatch),
		toggleGroupDis: bindActionCreators(toggleGroupDis, dispatch),
		toggleBranchDis: bindActionCreators(toggleBranchDis, dispatch),
		toggleFlod: bindActionCreators(toggleFlod, dispatch),
		switchBranch: bindActionCreators(switchBranch, dispatch),
		switchGroup: bindActionCreators(switchGroup, dispatch)
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(LeftDrawer);
