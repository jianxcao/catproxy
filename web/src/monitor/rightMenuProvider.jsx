import ReactDom, {render} from 'react-dom';
import React, {PropTypes, Component, isValidElement, cloneElement} from 'react';
import {MenuItem, Clearfix} from 'react-bootstrap';
import AdjustPos from './adjustpos';
export default class RightMenuProvider extends Component {
	constructor() {
		super();
		this.openRightMenu = this.openRightMenu.bind(this);
		this.destroy = this.destroy.bind(this);
		this._onSelect = this._onSelect.bind(this);
		this._bodyClick = this._bodyClick.bind(this);
		this.state = {
			menus: []
		};
	}
	componentDidMount () {
		this._mountNode = document.createElement('div');
		this._mountNode.className = "rightMenuWrap";
		document.body.appendChild(this._mountNode);
		document.body.addEventListener('mousedown', this._bodyClick);
	}
	componentWillUnmount () {
		this.destroy();
		document.body.removeChild(this._mountNode);
		this._mountNode = null;
	}
	
	static childContextTypes = {
		openRightMenu: React.PropTypes.func,
		closeRightMenu: React.PropTypes.func // 为实现
	}
	static propTypes = {
		children: React.PropTypes.element.isRequired
	}
	// 打开一个右键菜单
	/**
	 * @param pos 菜单位置，直接就是鼠标点击相对于屏幕的位置 
	 * @param menuItems 菜单的描述 是个数组，数组中应该是对对象，对象有每个菜单的内容
	 *  如 
	 * {
	 * 	header: false 是不是 头，头仅仅显示不能点击
	 * 	divider: false 是不是分割线，分割线仅仅显示不能点击
	 *  disable: false 是不是禁止使用该菜单
	 *  text : 菜单显示文本，可以是节点或者文本
	 *  title: “title文本”
	 *  eventKey: "按钮点击后得返回值"
	 * }
	 * @param menuClickEvt 点击后得事件 参数是点击菜单的名称
	 */
	openRightMenu({left, top, menuItems, menuClickEvt, className}) {
		if (menuItems && menuItems.length) {
			this.makeMenu({
				menus: menuItems,
				left: left,
				top: top,
				menuClickEvt,
				className
			});
		}
	}
	getChildContext() {
		return {
			openRightMenu: this.openRightMenu,
			closeRightMenu: this.destroy
		};
	}
	_onSelect(eventKey, e) {
		if (this._menuClickEvt) {
			let result = this._menuClickEvt.call(undefined, eventKey);
			if (result !== false) {
				this.destroy();
			}
		} else {
			this.destroy();
		}
	}
	_bodyClick(e) {
		if (this._menu) {
			let ele = e.target;
			let isTrigger = true;
			while(ele !== document.body && ele !== null && ele.nodeType == 1) {
				ele = ele.parentNode;
				if (ele === this._mountNode) {
					isTrigger = false;
				}
			}
			if (isTrigger) {
				this.destroy();
			}
		}
	}
	destroy() {
		if (this._mountNode) {
			ReactDom.unmountComponentAtNode(this._mountNode);
		} 
		this._menu = null;
		this._menuClickEvt = null;
	}
	/**
	 * left: 点击位置，左边
	 * top: 点击位置右边
	 * menus菜单列表  可以是一个object
	 * {
	 *  disabled： truee
	 * 	header: true
	 * 	divider: true
	 *  eventKey: true,
	 *  text: true
	 * }
	 */
	makeMenu ({left, top, menus, menuClickEvt, className}) {
		let menu = "";
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
					return (<MenuItem {...props} key={index} onSelect={this._onSelect}>{current.text}</MenuItem>);
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
							<ul className={className} style={menuStyle}>
								{items}
							</ul>
						</AdjustPos>
				</Clearfix></div>);
			ReactDom.unstable_renderSubtreeIntoContainer(
				this, menu, this._mountNode
			);
			this._menu = menu;
			this._menuClickEvt = menuClickEvt;
		}
	}
	render() {
		let children = this.props.children;
		return (
			<div>{React.Children.only(children)}</div>
		);
	}
}
