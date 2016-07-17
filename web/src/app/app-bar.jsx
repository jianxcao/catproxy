import React from 'react';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import NavigationClose from 'material-ui/svg-icons/navigation/close';

export default () => (
	<AppBar
		title="catproxy"
		iconElementRight={
			<IconMenu
				iconButtonElement={
					<IconButton><MoreVertIcon /></IconButton>
				}
				targetOrigin={{horizontal: 'right', vertical: 'top'}}
				anchorOrigin={{horizontal: 'right', vertical: 'top'}}
			>
				<MenuItem primaryText="下载host文件" />
				<MenuItem primaryText="导入host文件" />
				<MenuItem primaryText="帮助" />
			</IconMenu>
		}
	/>
);

