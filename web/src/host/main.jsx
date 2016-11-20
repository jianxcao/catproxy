import React, {PropTypes} from 'react';
import Paper from 'material-ui/Paper';
import SubHeader from './subhead';
import EditRules from './editRules';
import { Provider,connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {
	drawerStatus,
} from './action/actions';
let outPaperStyle = {
	width: "100%",
	textAlign: 'center',
	display: 'block',
	position: "relative"
};
const innerPaperStyle = {
	height: "100%",
	width: "100%",
	display: 'block',
	position: 'relative'
};
// 右侧主要面板
class Main extends React.Component {
	constructor(props) {
		super(props);
	}

	static propTypes = {
	}

	render() {
		if (this.props.drawerStatus) {
			outPaperStyle.paddingLeft = 300;
		} else {
			outPaperStyle.paddingLeft = 0;
		}
		return (
			<Paper style={outPaperStyle} zDepth={0} >
				<Paper style={innerPaperStyle} zDepth={0}>
					<SubHeader/>
					<EditRules/>
				</Paper>
			</Paper>
		);
	}
}
function mapStateToProps(state) {
	return {
		drawerStatus: state.get('drawerStatus')
	};
}
function mapDispatchToProps(dispatch) {
	return {
		changeDrawerStatus: bindActionCreators(drawerStatus, dispatch)
	};
}
export default connect(mapStateToProps, mapDispatchToProps)(Main);

