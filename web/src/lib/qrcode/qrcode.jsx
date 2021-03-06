import React, { PropTypes } from 'react';
import qrcode from './code';
export default class QrCode extends React.Component {
	componentDidMount() {
		let opt = Object.assign({}, this.props.opt);
		qrcode(this.refs.qrcode, opt);
	}
	static propTypes = {
		opt: PropTypes.object.isRequired,
	};
	static defaultProps = {
		opt: {},
	};
	render() {
		let { opt, ...props } = this.props;
		return <div ref='qrcode' {...props}></div>;
	}
}
