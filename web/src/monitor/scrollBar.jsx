import { Scrollbars } from 'react-custom-scrollbars';
import ReactDom, {render} from 'react-dom';
import React, {PropTypes, Component} from 'react';
export default class CustomScrollbars extends Component {
	renderTrackHorizontal(props) {
		return <div {...props} className="trackHorizontal"/>;
	}
	renderTrackVertical(props) {
		return <div {...props} className="trackVertical"/>;
	}
	renderThumbHorizontal(props) {
		let {style ={}, ...myProp} = props;
		style.height = 7;
		return <div {...myProp} style={style} className="thumbHorizontal"/>;
	}
	renderThumbVertical(props) {
		let {style = {}, ...myProp} = props;
		style.width = 7;
		return <div {...myProp} style={style} className="thumbVertical"/>;
	}
	renderView(props) {
		return <div {...props} className="scrollBarBiew"/>;
	}
	render() {
		let props = this.props;
		return (
			<Scrollbars {...props}
				renderTrackHorizontal={this.renderTrackHorizontal}
				renderTrackVertical={this.renderTrackVertical}
				renderThumbHorizontal={this.renderThumbHorizontal}
				renderThumbVertical={this.renderThumbVertical}
				renderView={this.renderView}>
				{this.props.children}
			</Scrollbars>
		);
	}
}
