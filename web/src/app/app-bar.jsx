import React from 'react';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import { Provider,connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {drawerStatus} from './action/actions';

class Header extends React.Component {
	constructor(props) {
		super(props)
	}
	handleToggle = () => {
		let {drawerStatus, changeDrawerStatus} = this.props;
		changeDrawerStatus(!drawerStatus);
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
						<MenuItem primaryText="下载host文件" />
						<MenuItem primaryText="导入host文件" />
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
