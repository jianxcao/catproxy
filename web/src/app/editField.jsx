import React from 'react';
import TextField from 'material-ui/TextField';
//可编辑字段
let style = {
	display: 'inline-block',
	width: "66%",
	marginLeft: "58px"
};
let inputStyle = {

}
export default class EditField extends React.Component {
		constructor(props) {
		super(props);
		this.state = {
			isEditor: false,
			val: this.props.val || ""
		}
	}
	static propTypes = {
	    valueChange: React.PropTypes.func,
	    val: React.PropTypes.string
	}
	static defaultProps = {
		val: ""
	}

	handleChaneToField() {
		this.setState(Object.assign({}, this.state, {
			isEditor: true
		}));
	}
	//组件更新过了
	componentDidUpdate(prevProps, prevState) {
			//正在编辑
			if (this.state.isEditor) {
				this.refs.myTextInput.input.select();
			}
	}

	handleChaneToText(evt) {
		let valChange = this.props.valChange;
		let val = evt.target.value;
		if (valChange) {
			valChange(evt.target.value);
		}
		this.setState({
			isEditor: false,
			val: val
		});
	}

	handleInputClick(evt) {
		evt.stopPropagation();
	}
	
	shouldComponentUpdate(nextProps, nextState) {
		return !(this.state.isEditor === nextState.isEditor && nextProps.val === this.props.val);
	}
	componentWillReceiveProps(nextProps) {
		var {isEditor, val} = this.state;
		if (val !== nextProps.val) {
			val = nextProps.val;
			this.setState({
				isEditor: isEditor,
				val: val
			});
		}
	}

	render(){
		if (this.state.isEditor) {
		 return (<TextField
					name="myTextInput"
					ref="myTextInput"
					style={style}
					inputStyle={inputStyle}
					defaultValue={this.state.val}
					onMouseDown={this.handleInputClick}
					onBlur={this.handleChaneToText.bind(this)}
			/>)
		} else {
			return (<div style={style} onDoubleClick={this.handleChaneToField.bind(this)}>{this.state.val}</div>)
		}
	}
}
