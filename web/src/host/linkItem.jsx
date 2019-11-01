import React, { PropTypes } from 'react';
import MenuItem from 'material-ui/MenuItem';
const linkStyle = {
	display: 'block',
};
class LinkItem extends React.Component {
	render() {
		let { outStyle, href } = this.props;
		let myProps = Object.assign({}, this.props);
		outStyle = Object.assign({}, linkStyle, outStyle);
		delete myProps.outStyle;
		delete myProps.href;
		return (
			<a style={outStyle} href={href} target='_blank'>
				<MenuItem {...myProps} />
			</a>
		);
	}
}
export default LinkItem;
