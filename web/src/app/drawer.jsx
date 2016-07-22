import React, {PropTypes} from 'react';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/Subheader';
import Subheader from 'material-ui/Subheader';
import typography from 'material-ui/styles/typography';
import { Provider,connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {
	drawerStatus,
	addBranch,
	delBranch,
	addGroup,
	delGroup,
	changeGroupName,
	changeBranchName,
	toggleGroupDis,
	toggleBranchDis
} from './action/actions';
import {List} from 'material-ui/List';
import ListItem from './listItem';

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
		changeGroupName: React.PropTypes.func,
		changeBranchName: React.PropTypes.func,
		addBranch: React.PropTypes.func,
		delBranch: React.PropTypes.func,
		addGroup: React.PropTypes.func,
		delGroup: React.PropTypes.func,
		changeGroupName: React.PropTypes.func,
		changeBranchName: React.PropTypes.func,
		toggleGroupDis: React.PropTypes.func,
		toggleBranchDis: React.PropTypes.func
	}

	getChildContext() {
		let {
			addBranch,
			delBranch,
			addGroup,
			delGroup,
			changeGroupName,
			changeBranchName,
			toggleGroupDis,
			toggleBranchDis
		} = this.props;
		return {
			addBranch,
			delBranch,
			addGroup,
			delGroup,
			changeGroupName,
			changeBranchName,
			toggleGroupDis,
			toggleBranchDis
		}
	}
	//切换菜单显示隐藏
	handleToggleDrawer = () => {
		let {drawerStatus, changeDrawerStatus} = this.props;
		changeDrawerStatus(drawerStatus);
	}

	//渲染分支
	renderBranch(list, groupId) {
		let result = [];
		if (list && list.size > 0) {
			for(let key = 0, size = list.size; key < size; key ++) {
				let current = list.get(key);
				let props = {
					primaryText: current.get('name'),
					key,
					groupId: groupId,
					branchId: key
				}
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
			for(let key = 0, size = hosts.size; key < size; key++) {
				let current = hosts.get(key);
				let props = {
					primaryText: current.get('name'),
					key,
					groupId: key,
					nestedItems: this.renderBranch(current.get('branch'), key)
				}
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
		addBranch: bindActionCreators(addBranch, dispatch),
		delBranch: bindActionCreators(delBranch, dispatch),
		addGroup: bindActionCreators(addGroup, dispatch),
		delGroup: bindActionCreators(delGroup, dispatch),
		changeGroupName: bindActionCreators(changeGroupName, dispatch),
		changeBranchName: bindActionCreators(changeBranchName, dispatch),
		toggleGroupDis: bindActionCreators(toggleGroupDis, dispatch),
		toggleBranchDis: bindActionCreators(toggleBranchDis, dispatch)
	};
}
export default connect(mapStateToProps, mapDispatchToProps)(LeftDrawer);
