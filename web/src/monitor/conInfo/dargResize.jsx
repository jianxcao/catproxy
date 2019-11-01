import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import DOMMouseMoveTracker from 'fixed-data-table/internal/DOMMouseMoveTracker';
export default class DragResize extends Component {
	constructor() {
		super();
		this._onMove = this._onMove.bind(this);
		this._mouseDown = this._mouseDown.bind(this);
		this._onEnd = this._onEnd.bind(this);
	}
	componentDidMount() {
		this._mouseMoveTracker = new DOMMouseMoveTracker(this._onMove, this._onEnd, document.body);
	}
	componentWillUnmount() {
		if (this._mouseMoveTracker) {
			this._mouseMoveTracker.releaseMouseMoves();
			document.body.style.cursor = '';
			this._mouseMoveTracker = null;
		}
	}
	_onMove(deltaX, deltaY) {
		let { onDargResize, props } = this.props;
		if (onDargResize) {
			onDargResize(-deltaX, -deltaY);
		}
	}
	_onEnd() {
		if (this._mouseMoveTracker) {
			this._mouseMoveTracker.releaseMouseMoves();
			document.body.style.cursor = '';
		}
	}
	_mouseDown(evt) {
		this._mouseMoveTracker.captureMouseMoves(evt);
		document.body.style.cursor = 'ew-resize';
	}
	render() {
		let { onDargResize, props } = this.props;
		return <div className='dargResize' onMouseDown={this._mouseDown} {...props}></div>;
	}
}
