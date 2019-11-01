import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import cx from 'classnames';
export default class ViewData extends Component {
	constructor() {
		super();
		this._handleClickTitle = this._handleClickTitle.bind(this);
	}
	static propTypes = {
		expand: PropTypes.bool,
	};
	static state = {
		expand: false,
	};
	componentWillMount() {
		let expand = this.props.expand;
		if (expand !== false) {
			expand = true;
		}
		this.setState({
			expand,
		});
	}

	_handleClickTitle() {
		this.setState({
			expand: !this.state.expand,
		});
	}

	render() {
		let { header, content, props, children, className } = this.props;
		let { expand } = this.state;
		let result = [];
		if (header) {
			let headerCls = cx('headerTitle', {
				active: expand,
			});
			result.push(
				<div key='header' className={headerCls} onClick={this._handleClickTitle}>
					{header}
				</div>
			);
		}
		let contentStyle = {
			display: expand ? 'block' : 'none',
		};
		let contentCls = cx('headerContent', {
			active: expand,
		});
		if (content || children) {
			result.push(
				<div key='content' className={contentCls} style={contentStyle}>
					{content || ''}
					{children}
				</div>
			);
		}
		let warpCls = cx('viewData', 'viewHeader', ...(className || '').split(' '));
		return (
			<div {...props} className={warpCls}>
				{result}
			</div>
		);
	}
}
