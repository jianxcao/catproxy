import React,{PropTypes} from 'react';
// import MobileTearSheet from '../../../MobileTearSheet';
import {List, ListItem} from 'material-ui/List';
import ActionGrade from 'material-ui/svg-icons/action/grade';
import ContentInbox from 'material-ui/svg-icons/content/inbox';
import ContentDrafts from 'material-ui/svg-icons/content/drafts';
import ContentSend from 'material-ui/svg-icons/content/send';
import Subheader from 'material-ui/Subheader';
class ListView extends React.Component {
	constructor(props) {
		super(props);
	}
	static state = {
		hosts: {
			caipiao: {

			}
		}  
	}

	static propTypes ={
		hosts: PropTypes.object
	}
	static defaultProps = {
		hosts: {}
	}
	componentWillUpdate = function(nextProps, nextState) {
		console.log('update');
	}
	renderList() {
		var hosts = this.props.hosts;
		var ch = [];
		// console.log(hosts);
		for(var key in hosts) {
			ch.push(
				<ListItem
					primaryText= {key}
					key={key}
					leftIcon={<ContentInbox />}
					initiallyOpen={true}
					primaryTogglesNestedList={true}
					nestedItems={[
						<ListItem
							key={1}
							primaryText="Starred"
							leftIcon={<ActionGrade />}
						/>,
						<ListItem
							key={2}
							primaryText="Sent Mail"
							leftIcon={<ContentSend />}
							disabled={true}
						/>,
					]}
			/>
			)
		}
		return ch;
	}
	render() {
		return (
		<div className="listView">
			<List>
				<Subheader>hosts</Subheader>
				{this.renderList()}
			</List>
		</div>
		)
	};
}
export default ListView;
