import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import {Navbar, Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap';
import createFragment from 'react-addons-create-fragment';
export default class ResToolBar extends Component {
	constructor() {
		super();
		this._changeFormat = this._changeFormat.bind(this);
		this._changeCharset = this._changeCharset.bind(this);
		this._JSONFormat = this._JSONFormat.bind(this);
	}
	static propTypes = {
		formatCode: PropTypes.bool,
		charset: PropTypes.string.isRequired,
		changeFormatCode: PropTypes.func,
		changeCharset: PropTypes.func,
		changeJSONFormat: PropTypes.func,
		isJSONStr: PropTypes.bool.isRequired
	}
	static defaultProps = {
		charset: "utf-8",
		formatCode: false,
	}	
	_changeFormat(e) {
		 let {changeFormatCode} = this.props;
		 if (changeFormatCode) {
			 changeFormatCode(e.currentTarget.checked);
		 }
	}
	_changeCharset(e) {
		 let {changeCharset} = this.props;
		 if (changeCharset) {
			 changeCharset();
		 }
	}
	_JSONFormat(e) {
		let {changeJSONFormat} = this.props;
		let val = +(e.target.value);
		if (changeJSONFormat) {
			changeJSONFormat(val === 1);
		}
	}
	render() {
		// 格式化成json树，可以没有这个字段，比如html是无法格式化成json树得
		let {charset, formatCode, isJSONStr, jsonFormat} = this.props;
		let result = {};
		result["bar0"] = (
			<Nav>
				<NavDropdown eventKey={"Dropdown"} title={charset} className="charset" id="charset">
					<MenuItem eventKey="utf8">utf8</MenuItem>
					<MenuItem eventKey="gbk">gbk</MenuItem>
					<MenuItem eventKey="gbk">gb2312</MenuItem>
				</NavDropdown>			
			</Nav>
		);
		if (isJSONStr) {
			result["bar1"] = <div className="split"></div>;
			result["bar2"] = (
				<div className="jsonFormat">
					<span><input type="radio" name="resToolBarFormatJSON" id="resToolBarCode" value="0" defaultChecked={!jsonFormat} onChange={this._JSONFormat}/>
					<label htmlFor="resToolBarCode">源</label></span>
					<span><input type="radio" name="resToolBarFormatJSON" id="resToolBarFormatJSON" value="1" defaultChecked={jsonFormat} onChange={this._JSONFormat}/>
					<label htmlFor="resToolBarFormatJSON">JSON树</label></span>
				</div>
			);
		}
		if (!isJSONStr || (isJSONStr && !jsonFormat)) {
			result["bar3"] =(<div className="split"></div>);
			result["bar4"] = (<div className="formatCode">
						<span><input type="checkbox" name="type" id="resToolBarFormatCode" value="format" defaultChecked={!!formatCode} onChange={this._changeFormat}/>
						<label htmlFor="resToolBarFormatCode"></label>格式化</span>
				</div>);
		}
		result = createFragment(result);
		return (<div className="resToolBar">{result}</div>);
	}
}
