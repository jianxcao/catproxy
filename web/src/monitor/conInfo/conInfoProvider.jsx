import ReactDom, {render} from 'react-dom';
import React, {PropTypes, Component, isValidElement, cloneElement} from 'react';
import ConInfo from './conInfo';
import merge from 'lodash/merge';
export default class ConInfoProvider extends Component {
	constructor() {
		super();
		this.openConInfo = this.openConInfo.bind(this);
		this.closeConInfo = this.closeConInfo.bind(this);
	}
	componentDidMount () {
		this._mountNode = document.createElement('div');
		this._mountNode.className = "conInfoMount";
		document.body.appendChild(this._mountNode);
	}
	componentWillUnmount () {
		this.destroy();
		document.body.removeChild(this._mountNode);
		this._mountNode = null;
	}

	static childContextTypes = {
		openConInfo: React.PropTypes.func,
		closeConInfo: React.PropTypes.func
	}

	static propTypes = {
		children: React.PropTypes.element.isRequired
	}

	getChildContext() {
		return {
			openConInfo: this.openConInfo,
			closeConInfo: this.closeConInfo
		};
	}

	openConInfo(opt) {
		// 当前已经打开了一个, 干掉他，从开一个
		if (this._conInfo) {
			this.destroy();
		}
		return this.makeConInfo(opt);
	}
	closeConInfo() {
		this.destroy();
	}
	makeConInfo (opt) {
		opt = opt || {};
		let result = (<ConInfo opt = {opt}></ConInfo>);
		this._conInfo = result;
		// 返回 组件对象，注意不要乱用，销毁时请回收
		let instance = ReactDom.unstable_renderSubtreeIntoContainer(
			this, result, this._mountNode
		);
		return instance;
	}

	destroy() {
		if (this._mountNode) {
			ReactDom.unmountComponentAtNode(this._mountNode);
		} 
		this._conInfo = null;
	}

	render() {
		let children = this.props.children;
		return (
			<div>{React.Children.only(children)}</div>
		);
	}
}
