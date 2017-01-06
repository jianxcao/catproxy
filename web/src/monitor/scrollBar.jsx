import { Scrollbars } from 'react-custom-scrollbars';
import ReactDom, {render} from 'react-dom';
import React, {PropTypes, Component} from 'react';
export default class CustomScrollbars extends Component {
	render() {
		return (
			<Scrollbars
				renderTrackHorizontal={props => <div {...props} className="trackHorizontal"/>}
				renderTrackVertical={props => <div {...props} className="trackVertical"/>}
				renderThumbHorizontal={props => <div {...props} className="thumbHorizontal"/>}
				renderThumbVertical={props => <div {...props} className="thumbVertical"/>}
				renderView={props => <div {...props} className="scrollBarBiew"/>}>
				{this.props.children}
			</Scrollbars>
		);
	}
}
