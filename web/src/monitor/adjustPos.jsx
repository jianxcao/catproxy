import React, { Component, cloneElement, PropTypes } from 'react';
import ReactDom, { findDOMNode } from 'react-dom';

// 根据传入的值调整组件的位置
class AdjustPos extends Component {
	constructor(...args) {
		super(...args);
	}
	state = {
		left: -9999,
		top: -9999,
	};
	static propTypes = {
		left: PropTypes.number.isRequired,
		top: PropTypes.number.isRequired,
	};
	// 组件挂砸
	componentDidMount() {
		this.pos();
	}
	// 组件更新
	componentDidUpdate(prevProps, prevState) {}

	pos() {
		// 找到子元素
		let tip = findDOMNode(this);
		let { left, top } = this.props;

		let tipPos = tip.getBoundingClientRect();
		let w = window.innerWidth;
		let h = window.innerHeight;
		// 边界值检测
		if (left < 0) {
			left = 0;
		}
		if (top < 0) {
			top = 0;
		}
		if (left > w) {
			left = w;
		}
		if (top > h) {
			top = h;
		}
		let w1 = w - left;
		let h1 = h - top;
		if (w1 < tipPos.width) {
			left = left - tipPos.width;
		}
		if (h1 < tipPos.height) {
			top = top - tipPos.height;
		}
		this.setState({
			left,
			top,
		});
	}
	render() {
		const { children, target, placement, left, top, ...props } = this.props;
		return cloneElement(children, {
			...props,
			style: {
				...children.props.style,
				left: this.state.left,
				top: this.state.top,
			},
		});
	}
}

export default AdjustPos;
