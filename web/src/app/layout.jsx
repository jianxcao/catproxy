import React, {PropTypes} from 'react';
import AppBar from './app-bar';
import LeftDrawer from './drawer';
import RightPaper from './main';
export default class LayOut extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			groupId: 0,
			branchId: 0			
		}
	}

	static contextTypes = {
		muiTheme: PropTypes.object.isRequired
	};

	static childContextTypes = {
		changeBranch: React.PropTypes.func
	}

	getChildContext() {
		return {
			changeBranch: (groupId, branchId) => {
				if (groupId >= 0 && branchId >= 0) {
					this.setState(Object.assign({}, this.state, {
						groupId,
						branchId
					}));
				}
			}
		}
	}
	render() {
		return (
			<div className="layout">
				<AppBar/>
				<LeftDrawer/>
				<RightPaper branchId={this.state.branchId} groupId= {this.state.groupId}/>
			</div>
		);
	}
} 
