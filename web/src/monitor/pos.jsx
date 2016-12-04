import React, {Component, cloneElement, PropTypes} from 'react';
import ReactDom, {findDOMNode} from 'react-dom';
// 指定组件的位置 包括 left top bottom right;
class Pos extends Component {
	constructor(...args) {
		super(...args);
		// 'top', 'right', 'bottom', 'left'
		this.state = {
			left: 0,
			top: 0
		};
	}
	static propTypes = {
		// 必须是个dom节点
		target: PropTypes.any.isRequired,
		children: React.PropTypes.element.isRequired
	}
	// 组件挂砸
	componentDidMount() {
		this.pos();
	}
	// 组件更新
	componentDidUpdate(prevProps, prevState) {
	}
	curPos (targetPos, tipPos, placement) {
		let top = 0, left = 0;
		if ('top' === placement) {
			top = targetPos.top - tipPos.height;
			left = targetPos.left + targetPos.width/2 - tipPos.width/2;
		} else if('left' === placement) {
			top = targetPos.top + targetPos.height/2 - tipPos.height/2;;
			left = targetPos.left - tipPos.width;
		} else if('right' === placement) {
			top = targetPos.top + targetPos.height/2 - tipPos.height/2;;
			left = targetPos.left + targetPos.width;
		} else {
			placement = 'bottom';
			top = targetPos.top + targetPos.height;
			left = targetPos.left + targetPos.width/2 - tipPos.width/2;
		}
		return {left, top};
	}
	pos() {
		// 找到子元素
		let tip = findDOMNode(this);
		let {target, placement} = this.props;
		let targetPos = target.getBoundingClientRect();
		let tipPos = tip.getBoundingClientRect();
		// 自动调整位置保证不出屏幕
		if (placement === 'atuo') {
			let newPlaceMent = "";
			["right", "bottom", "left", 'top'].forEach(current => {
				
			});
		}
		let pp = this.curPos(targetPos, tipPos, placement);
		
		this.setState(pp);
	}
	render () {
		const {children, target, placement, ...props} = this.props;
		return cloneElement(children, {
			...props,
			style:{
				left: this.state.left,
				top: this.state.top
			}
		});
	}
}

export default Pos;
