import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, isValidElement, cloneElement } from 'react';
import Pos from './pos';
export default class ToolTipProvider extends Component {
	constructor(props, context) {
		super(props, context);
		this._onMouseOver = this._onMouseOver.bind(this);
		this._onMouseOut = this._onMouseOut.bind(this);
	}

	componentDidMount() {
		this._mountNode = document.createElement('div');
		this._mountNode.className = 'toolTipWrap';
		document.body.appendChild(this._mountNode);
	}

	componentWillUnmount() {
		ReactDom.unmountComponentAtNode(this._mountNode);
		document.body.removeChild(this._mountNode);
		this._mountNode = null;
	}

	renderOverlay() {
		ReactDom.unstable_renderSubtreeIntoContainer(this, this._overlay, this._mountNode);
	}
	makeOverlay(overlay, ele) {
		return (
			<Pos target={ele}>
				<div className='myToolTip'>{overlay}</div>
			</Pos>
		);
	}
	_onMouseOver(e) {
		let ele = e.target;
		this._overTime = setTimeout(() => {
			while (ele !== null && ele.nodeType === 1 && ele.nodeName !== 'BODY') {
				let tip = ele.getAttribute('data-tip');
				if (tip) {
					this._overlay = this.makeOverlay(tip, ele);
					this.renderOverlay();
					break;
				}
				ele = ele.parentNode;
			}
		}, 350);
	}
	_onMouseOut() {
		if (this._overTime) {
			clearTimeout(this._overTime);
		}
		if (this._overlay) {
			ReactDom.unmountComponentAtNode(this._mountNode);
		}
	}
	render() {
		let children = this.props.children;
		return (
			<div onMouseOver={this._onMouseOver} onMouseOut={this._onMouseOut}>
				{children}
			</div>
		);
	}
}
