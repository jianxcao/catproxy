import React, {PropTypes} from 'react';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
const outPaperStyle = {
	width: "100%",
	paddingLeft: 300,
	textAlign: 'center',
	display: 'block',
	position: "relative"
};
const innerPaperStyle = {
	height: "100%",
	width: "100%",
	display: 'block',
	position: 'relative'
}
const toobarStyle ={
	paddingLeft: 20
}
//右侧主要面板
export default class Main extends React.Component {
	create() {

	}
	render() {
		return (
			<Paper style={outPaperStyle} zDepth={0} >
				<Paper style={innerPaperStyle} zDepth={0}>
					<Toolbar style={toobarStyle}>
						<ToolbarGroup firstChild={false}>
							<ToolbarTitle text="操作" />
							<RaisedButton label="新建" primary={true} />
							<RaisedButton label="禁用全部" primary={true} />
						</ToolbarGroup>
						<ToolbarGroup>
							<RaisedButton label="保存" primary={true} />
						</ToolbarGroup>
					</Toolbar>
				</Paper>
			</Paper>
		)
	}
}
