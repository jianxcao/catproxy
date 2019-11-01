import React, { PropTypes, Component } from 'react';
import ReactDom, { render, findDOMNode, unmountComponentAtNode } from 'react-dom';
import QRrcode from './qrcode';
import style from './qrcodeDialog.less';
export class QrcodeDialog extends Component {
	constructor() {
		super();
		this.destory = this.destory.bind(this);
		this.handelQrcodeMaskClick = this.handelQrcodeMaskClick.bind(this);
	}
	static propTypes = {
		opt: PropTypes.object.isRequired,
	};
	destory() {
		let node = findDOMNode(this);
		window.setTimeout(() => {
			if (node) {
				node = node.parentNode;
				unmountComponentAtNode(node);
				let p = node.parentNode;
				if (p) {
					p.removeChild(node);
				}
			}
		}, 16);
	}
	// 二维码点击
	handelQrcodeClick(e) {
		e.preventDefault();
		e.stopPropagation();
	}
	// 背景层点击
	handelQrcodeMaskClick(e) {
		this.destory();
	}
	render() {
		let { opt, ...props } = this.props;
		return (
			<div className='qrcodeWrap' {...props}>
				<div className='qrMask' onClick={this.handelQrcodeMaskClick}></div>
				<div className='qrcode' onClick={this.handelQrcodeClick}>
					<div className='closeBtn' onClick={this.destory}></div>
					<QRrcode opt={opt}></QRrcode>
				</div>
			</div>
		);
	}
}

export default function qrcode(opt) {
	let div = document.createElement('div');
	div.id = 'qrCodeRoot';
	document.body.appendChild(div);
	let instance = render(<QrcodeDialog opt={opt}></QrcodeDialog>, div);
	return {
		destory() {
			unmountComponentAtNode(div);
			document.removeChild(div);
		},
		instance,
	};
}
