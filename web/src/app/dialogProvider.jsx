import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';

var guid = 1;
const wrapStyle = {
	width: '500px',
	maxWidth: 'none',
	textAlign: 'center',
	overflow: "hidden",
	border: "1px solid #ccc"
};
const bodyStyle = {
	padding: "12px",
	minWidth: "200px"
}
const actionType = {
	"CONTENT": "CONTENT"
}
var dialgoNum = 0;
var dialogCache = {};
export default class DialogProvider extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			dialogs: {}
		}
	}

	handleBtnClick(evt){
		let {target} = evt;
		let btnId;
		while(target) {
			btnId = target.getAttribute('data-btn-id');
			if (btnId !== null && btnId !== undefined) {
				break;
			}
			target = target.parentElement;
		}
		let dialogId = target.getAttribute('data-dialog-id');
		let dialogConfig = dialogCache[dialogId];
		let result;
		if (dialogConfig.onBtnClick) {
			result = dialogConfig.onBtnClick(btnId, dialogId);
		}
		if (result !== false) {
			this.destory(dialogId);
		}
	}

	destory(dialogId) {
		if (!dialogId) {
			this.setState({
				dialogs: {}
			});
			dialogCache = {};
			dialgoNum = 0;
		} else {
			let dialogs = this.state.dialogs;
			if (dialogs[dialogId]) {
				delete dialogs[dialogId];
				delete dialogCache[dialogId];
				dialgoNum = dialgoNum - 1;
				this.setState(Object.assign({}, this.state, {
					dialogs: dialogs
				}));
			}
		}
	}

	dialog (opt, action, control) {
		if (typeof opt === 'string') {
			if (actionType[action] && dialogCache[opt]) {
				switch(action) {
					case(actionType.CONTENT):
					dialogCache[opt].msg = control;
					this.forceUpdate();
					break;
					default:
				}
			} else {
				console.warn('错误的弹窗动作');
			}
			return;
		}
		let {title, msg, onBtnClick, btn, contentStyle, bodyStyle, layout} = opt;
		if (!msg) {
			return;
		}
		if (layout === undefined) {
			layout = 1;
		}
		let modal = true;
		//蒙层参数(0不显示 -1全透明 1半透明 2强制半透明)
		let type = {
			"false": 0,
			"true": 1,
			"-1": -1,
			0: 0,
			1: 1,
			2: 2
		}[layout];
		let bgColor = 'rgba(0, 0, 0, 0.5)';
		if (layout === 0) {
			modal = false;
		} else {
			if (layout === -1) {
				bgColor = "transparent";
			}
		}
		dialgoNum = dialgoNum + 1;
		if (dialgoNum > 1 && layout !== -2) {
			bgColor = "transparent";
		}
		let id = 'dialog' + guid++;
		contentStyle = Object.assign({}, wrapStyle, contentStyle);
		bodyStyle = bodyStyle || {};
		//将dialog配置放入缓存
		dialogCache[id] = {
			title,
			msg,
			overlayStyle: {backgroundColor: bgColor},
			contentStyle,
			bodyStyle,
			onBtnClick,
			button: this.getBtns(btn && btn.length >= 0 ? btn : ["取消", "*确定"], id),
			modal: modal,
			open: true
		}
		let dialogs = this.state.dialogs;
		dialogs[id] = true;
		//从state标记这个dialog存在了
		this.setState(Object.assign({}, this.state, {
			dialogs: dialogs
		}));
		return id;
	}

	toast(msg, time) {
		let id = this.dialog({
			msg,
			btn:[],
			contentStyle: {
				border: "0px",
				borderRadius: "5px",
				boxShadow: "rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px"
			},
			bodyStyle: {
				backgroundColor: "rgba(0, 0, 0, 0.870588)",
				fontSize:"14px",
				color: "#fff",
				padding: "12px"
			}
		});
		window.setTimeout((()=> {
		 this.destory(id);
		}).bind(this), +time || 1000);
	}

	static childContextTypes = {
		dialog: React.PropTypes.func,
		toast: React.PropTypes.func
	}
	
	static propTypes = {
		children: React.PropTypes.element.isRequired
	}

	getChildContext() {
		return {
			dialog: this.dialog.bind(this),
			toast: this.toast.bind(this)
		}
	}

	getBtns(btns = [], dialogId) {
		let t = /^\*.*$/;
		return btns.map((current, index) => {
			let text = t.test(current) ? current.slice(1) : current;
			return ( 
				<FlatButton
					key={index}
					label= {text}
					primary={true}
					data-btn-id = {index}
					data-dialog-id ={dialogId}
					keyboardFocused={text !== current}
					onTouchTap={this.handleBtnClick.bind(this)}
				/>
			);
		});
	}

	render() {
		let dialogs = this.state.dialogs;
		let content = [];
		for(let one in dialogs) {
			let current = dialogCache[one];
			content.push(
				<Dialog
					title={current.title}
					id={one}
					key={one}
					actions={current.button}
					modal={current.modal}
					contentStyle={current.contentStyle}
					overlayStyle={current.overlayStyle}
					bodyStyle={current.bodyStyle}
					autoDetectWindowHeight={false}
					open={current.open}>
					{current.msg}
				</Dialog>
			)
		}
		return (
			<div>
				{React.Children.only(this.props.children)}{content}
			</div>
		);
	}
}
