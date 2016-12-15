import ReactDom, {render} from 'react-dom';
import React, {PropTypes, Component, isValidElement, cloneElement} from 'react';
import {MenuItem, Clearfix} from 'react-bootstrap';
import AdjustPos from './adjustpos';
import Clipboard from 'clipboard';
export default class RightMenu extends Component{
	constructor(...props) {
		super(...props);
		this._onSelect = this._onSelect.bind(this);
	}
	static propTypes = {
		destroy: PropTypes.func.isRequired,
		left: PropTypes.number.isRequired,
		top: PropTypes.number.isRequired
	}
	// 组件已经加载
	componentDidMount () {
		let {menus} = this.props;
		this.clipborad = new Clipboard('.dropdown-menu a[data-index]', {
			text: function(trigger) {
				let index = +trigger.getAttribute('data-index');
				let copy = menus[index].copy || "";
				if (copy) {
					if (typeof copy === 'object') {
						copy = JSON.stringify(copy);
					} else {
						copy = copy;
					}
				}
				return copy;
			}
		});
	}
	componentWillUnmount() {
		// 菜单销毁，就销毁复制组件
		if (this.clipborad) {
			this.clipborad.destroy();
		}
	}
	_onSelect(eventKey, e) {
		let {menuClickEvt, destroy} = this.props;
		if (menuClickEvt) {
			let result = menuClickEvt.call(undefined, eventKey);
			if (result !== false) {
				destroy();
			}
		} else {
			destroy();
		}
	}
	render() {
		let {left, top, menus, menuClickEvt, className, destroy, ...otherProps} = this.props;
		let menu = <div></div>;
		let menuStyle = {
			left,
			top,
			display:"block"
		};
		let items = [];
		// 直接传递了一个  react Element
		if (isValidElement(menus)) {
			items = menus;
		} else if (menus.length) {
			items = menus.map((current, index) => {
				// 自定义菜单
				if (isValidElement(current) && current.type === MenuItem.type) {
					return current;
				} else {
					// 系统菜单
					let props = {
						disabled: !!current.disabled,
						header: !!current.header,
						divider: !!current.divider
					};
					if (current.title) {
						props.title = current.title;
					}
					if (current.eventKey) {
						props.eventKey = current.eventKey;
					}
					if (!props.href) {
						props.href = "javascript:void(0);";
					}
					return (<MenuItem {...props} key={index} data-index={index} onSelect={this._onSelect}>{current.text}</MenuItem>);
				}
			});
			if (className) {
				className = className + " dropdown-menu";
			} else {
				className = 'dropdown-menu';
			}
			menu = (
				<div><Clearfix>
						<AdjustPos left = {left} top ={top}>
							<ul className={className} style={menuStyle} {...otherProps}>
								{items}
							</ul>
						</AdjustPos>
				</Clearfix></div>);
		}
		return menu;
	}
};
