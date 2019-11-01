import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component } from 'react';
import cx from 'classnames';
export default class Loading extends Component {
	render() {
		let { className, ...prop } = this.props;
		let cn = cx('loading', ...className.split(' '));
		return (
			<div className={cn} {...prop}>
				<div className='loading-center'>
					<div className='ani one'></div>
					<div className='ani two'></div>
					<div className='ani three'></div>
				</div>
			</div>
		);
	}
}
