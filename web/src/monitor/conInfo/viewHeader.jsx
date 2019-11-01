import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import cx from 'classnames';
import ViewData from './viewData';
import { shouldEqual } from '../util';
export default class ViewHeader extends Component {
	constructor() {
		super();
		this._handleEncodeClick = this._handleEncodeClick.bind(this);
	}
	shouldComponentUpdate(nextProps, nextState) {
		return !(shouldEqual(this.props, nextProps) && shouldEqual(this.state, nextState));
	}
	componentWillMount() {
		this.state = {
			// 是否编码
			isUrlDecode: false,
		};
	}
	_handleEncodeClick(e) {
		e.stopPropagation();
		let { isUrlDecode } = this.state;
		this.setState({
			isUrlDecode: !isUrlDecode,
		});
	}
	render() {
		let { header, content, expand, children, ...props } = this.props;
		let { isUrlDecode } = this.state;
		let result = [];
		let headers = [header];
		headers.push(
			<em className='encode' key='source' onClick={this._handleEncodeClick}>
				{isUrlDecode ? '源编码' : '解码'}
			</em>
		);
		let t = typeof content;
		if (content) {
			if (content.size && content.reduce) {
				result = content.reduce((all, current, index) => {
					all.push(
						<div key={all.length}>
							<span>{index}:&nbsp;</span>
							<em>{isUrlDecode ? decodeURIComponent(current) : current}</em>
						</div>
					);
					return all;
				}, []);
			} else if (t === 'object') {
				result = [];
				for (let key in content) {
					result.push(
						<div key={result.length}>
							<span>{key}:&nbsp;</span>
							<em>{isUrlDecode ? decodeURIComponent(content[key]) : content[key]}</em>
						</div>
					);
				}
			}
		}
		return (
			<ViewData {...props} header={headers} content={result} expand={expand}>
				{children}
			</ViewData>
		);
	}
}
