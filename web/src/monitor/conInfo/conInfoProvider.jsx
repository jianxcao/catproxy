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
		this.destory();
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
			this.destory();
		}
		return this.makeConInfo(opt);
	}
	closeConInfo() {
		this.destory();
	}
	makeConInfo (opt) {
		opt = opt || {};
		let {onCreate, onDestory, ...option} = opt;
		if (onCreate) {
			this._onCreate = onCreate;
		}
		if (onDestory) {
			this._onDestory = onDestory;
		}
		let result = (<ConInfo opt = {option} destory={this.closeConInfo}></ConInfo>);
		// 返回 组件对象，注意不要乱用，销毁时请回收
		let instance = ReactDom.unstable_renderSubtreeIntoContainer(
			this, result, this._mountNode
		);
		this._conInfo = instance;
		if (this._onCreate) {
			this._onCreate(instance);
		}
		return instance;
	}

	destory() {
		if (this._mountNode && this._conInfo) {
			let status;
			if (this._onDestory) {
				status = this._onDestory(this._conInfo);
			}
			if (status !== false) {
				this._onDestory = null;
				this._onCreate = null;
				ReactDom.unmountComponentAtNode(this._mountNode);
				this._conInfo = null;
			}
		} 
	}

	render() {
		let children = this.props.children;
		return (
			<div>{React.Children.only(children)}</div>
		);
	}
}
