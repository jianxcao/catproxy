import React, {PropTypes} from 'react';
import AppBar from 'material-ui/AppBar';


export default class Test extends React.Component {

	componentDidMount() {
		console.log("Test", this.props)
	}
	shouldComponentUpdate(nextProps, nextState) {
			return true;  
	}
	static contextTypes = {
		hosts: PropTypes.object.isRequired
	}
	render() {
		return (<div></div>)
	}
}
