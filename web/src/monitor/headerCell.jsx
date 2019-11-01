import { Table, Column, Cell } from 'fixed-data-table';
import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
export default class HeaderCell extends Component {
	constructor() {
		super();
		this._onMouseOver = this._onMouseOver.bind(this);
		this._onMouseOut = this._onMouseOut.bind(this);
		this.state = {
			over: false,
		};
	}
	static propTypes = {
		onMouseOver: PropTypes.func,
		onMouseOut: PropTypes.func,
	};
	// 悬浮
	_onMouseOver(...arg) {
		let { onMouseOver } = this.props;
		if (onMouseOver) {
			onMouseOver.call(this, ...arg);
		}
		this._timeOver = setTimeout(() => {
			this.setState(({ over }) => ({ over: true }));
		}, 50);
	}
	// 悬浮出去
	_onMouseOut(...arg) {
		let { onMouseOut } = this.props;
		if (onMouseOut) {
			onMouseOut.call(this, ...arg);
		}
		if (this._timeOver) {
			clearTimeout(this._timeOver);
			this._timeOver = null;
		}
		if (this.state.over) {
			this.setState(({ over }) => ({ over: false }));
		}
	}
	render() {
		let { columnKey, onMouseOver, onMouseOut, className, ...props } = this.props;
		className = className || '';
		if (this.state.over) {
			className += 'header_hover';
		}
		return <Cell className={className} onMouseOver={this._onMouseOver} onMouseOut={this._onMouseOut} {...props}></Cell>;
	}
}
