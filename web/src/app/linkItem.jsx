import React,{PropTypes} from 'react';
import MenuItem from 'material-ui/MenuItem';
const linkStyle ={
	display:"block"
}
class LinkItem extends React.Component {
	render() {
		let {outStyle, href} = this.props;
		let props = Object.assign({}, this.props);
		outStyle = Object.assign({}, linkStyle, outStyle);
		delete props.outStyle;
		delete  props.href;
		return <a style={outStyle} href={href} target="_blank"><MenuItem {...props}/></a>;
	}
}
export default LinkItem;
