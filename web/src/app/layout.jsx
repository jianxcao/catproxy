import React, {PropTypes} from 'react';
import AppBar from './app-bar';
import LeftDrawer from './drawer';
import RightPaper from './main';
export default class LayOut extends React.Component {
	static contextTypes = {
		muiTheme: PropTypes.object.isRequired
	};

	render() {
		return (
			<div className="layout">
				<AppBar/>
				<LeftDrawer/>
				<RightPaper/>
			</div>
		);
	}
} 
