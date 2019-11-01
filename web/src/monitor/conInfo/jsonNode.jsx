import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import cx from 'classnames';
export default class JsonNode extends Component {
	constructor() {
		super();
		this._handleClickTitle = this._handleClickTitle.bind(this);
	}
	static propTypes = {
		expand: PropTypes.bool,
		type: PropTypes.string.isRequired,
		propKey: PropTypes.string,
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
		let { type, children, className, propKey, ...props } = this.props;
		let isExpand = !!this.state.expand;
		let result = [];
		let headerCls = cx('header', {
			active: !!this.state.expand,
		});
		// React.Children.count 有多少个节点的统计
		let dotted = [];
		if (propKey) {
			dotted.push(
				<span className='key' key='propKey'>
					{propKey}
				</span>
			);
			dotted.push(':');
		}
		if (type === 'array') {
			dotted.push(
				<span className='abbr' key='abbr'>
					{isExpand ? '[' : '[ ... ]'}
				</span>
			);
		} else {
			dotted.push(
				<span className='abbr' key='abbr'>
					{isExpand ? '{' : '{ ... }'}
				</span>
			);
		}
		let warpCls = cx('jsonNode', ...(className || '').split(' '));
		let contentStyle = {
			display: isExpand ? 'block' : 'none',
		};
		let contentCls = cx('content', {
			active: isExpand,
		});
		return (
			<div {...props} className={warpCls}>
				<div key='header' className={headerCls} onClick={this._handleClickTitle}>
					<span className='start'>{dotted}</span>
				</div>
				<div style={contentStyle}>
					<div key='content' className={contentCls}>
						{children}
					</div>
					<div className='end'>{type === 'array' ? '[' : '}'}</div>
				</div>
			</div>
		);
	}
}
