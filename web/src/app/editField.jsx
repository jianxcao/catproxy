import React from 'react';
import TextField from 'material-ui/TextField';
//可编辑字段
let style = {
	display: 'inline-block',
	width: "56%",
	marginLeft: "82px"
};
let inputStyle = {

}
export default class EditField extends React.Component {
		constructor(props) {
		super(props);
	}
	static propTypes = {
		valueChange: React.PropTypes.func,
		editStatus: React.PropTypes.func,
		isEditor: React.PropTypes.bool,
		val: React.PropTypes.string
	}
	static defaultProps = {
		val: "",
		isEditor: false
	}

	//组件更新过了
	componentDidUpdate(prevProps, prevState) {
		//正在编辑
		if (this.props.isEditor) {
			this.refs.myTextInput.input.select();
		}
	}

	handleChaneToText(evt) {
		let valChange = this.props.valChange;
		let val = evt.target.value;
		if (valChange) {
			valChange(evt.target.value || this.props.val);
		}
	}

	handleInputClick(evt) {
		evt.preventDefault();
		evt.stopPropagation();
	}
	
	render(){
		if (this.props.isEditor) {
		 return (<TextField
					name="myTextInput"
					ref="myTextInput"
					style={style}
					inputStyle={inputStyle}
					defaultValue={this.props.val}
					onClick={this.handleInputClick}
					onMouseDown={this.handleInputClick}
					onBlur={this.handleChaneToText.bind(this)}
			/>)
		} else {
			return (<div style={style}>{this.props.val}</div>)
		}
	}
}
