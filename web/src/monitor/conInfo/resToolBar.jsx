import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import {Navbar, Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap';
import createFragment from 'react-addons-create-fragment';
import shallowCompare from 'react-addons-shallow-compare';
export default class ResToolBar extends Component {
	constructor() {
		super();
		this._changeFormat = this._changeFormat.bind(this);
		this._changeCharset = this._changeCharset.bind(this);
	}
	static propTypes = {
		formatCode: PropTypes.bool,
		charset: PropTypes.string.isRequired,
		changeFormatCode: PropTypes.func,
		changeCharset: PropTypes.func,
	}
	static defaultProps = {
		charset: "utf-8",
		formatCode: false,
	}	

	shouldComponentUpdate (nextProps, nextState) {
		return shallowCompare(this, nextProps, nextState);
	}
	
	_changeFormat(e) {
		 let {changeFormatCode} = this.props;
		 if (changeFormatCode) {
			 changeFormatCode(e.currentTarget.checked);
		 }
	}
	_changeCharset(eventKey, e) {
		 let {changeCharset} = this.props;
		 if (changeCharset) {
			 changeCharset(eventKey);
		 }
	}	

	render() {
		// 格式化成json树，可以没有这个字段，比如html是无法格式化成json树得
		let {charset, formatCode, jsonFormat} = this.props;
		let result = {};
		result["bar0"] = (
			<Nav>
				<NavDropdown eventKey={"charset"} title={charset} className="charset" id="charset" onSelect={this._changeCharset}>
					<MenuItem eventKey="utf8">utf8</MenuItem>
					<MenuItem eventKey="gbk">gbk</MenuItem>
					<MenuItem eventKey="gbk">gb2312</MenuItem>
				</NavDropdown>			
			</Nav>
		);
		// 美化按钮一定有，但是可能点击了没有效果
		result["bar3"] =(<div className="split"></div>);
		result["bar4"] = (<div className="formatCode">
					<span><input type="checkbox" name="type" id="resToolBarFormatCode" value="format" defaultChecked={!!formatCode} onChange={this._changeFormat}/>
					<label htmlFor="resToolBarFormatCode">美化</label></span>
			</div>);
	
		result = createFragment(result);
		return (<div className="resToolBar">{result}</div>);
	}
}
