import React, {PropTypes} from 'react';
import Paper from 'material-ui/Paper';
import SubHeader from './subhead';
import { Provider,connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Immutable,{Map, List} from 'Immutable';
import EditRule from "./editRule";
import RaisedButton from 'material-ui/RaisedButton';
import {
	addRule,
	delRule,
	toggleRuleDis,
	updateRule
} from './action/actions';

const paperStyle = {
	textAlign: "right",
	maxWidth: "800px",
	margin: "20px auto"
};
class EditRules extends React.Component{
	constructor(props) {
		super(props);
	}
	static propTypes = {
		groupId: React.PropTypes.number,
		branchId: React.PropTypes.number
	}
	static defaultProps = {
		groupId: 0,
		branchId: 0
	}
	//新建一个规则
	newRule() {
		let {groupId, branchId} = this.props;
		this.props.addRule(groupId, branchId, {
			disable: false,
			test: "",
			type: "host",
			exec: ""
		})
	}

	//删除一个规则
	delRule(ruleId) {
		let {groupId, branchId} = this.props;
		this.props.delRule(groupId, branchId, ruleId);
	}

	//禁止使用某个规则
	disRule(ruleId) {
		let {groupId, branchId} = this.props;
		this.props.toggleRuleDis(groupId, branchId, ruleId);
	}

	updateRule(ruleId, rule) {
		let {groupId, branchId} = this.props;
		this.props.updateRule(groupId, branchId, ruleId, rule);
	}

	render() {
		let rules = this.props.rules;
		let editRules = rules.map((current, index) => {
			return <EditRule rule={current} key={index} ruleId={index} 
			delRule={this.delRule.bind(this)}
			disRule={this.disRule.bind(this)}
			updateRule={this.updateRule.bind(this)}/>
		});

		return (
			<Paper zDepth={0}>
				<Paper zDepth={0} style={paperStyle}>
					<RaisedButton label="新建规则" primary={true} onClick={this.newRule.bind(this)}/>
				</Paper>
				{editRules}
			</Paper>
		);
	}
}

function mapStateToProps(state, owerProps) {
	let {groupId, branchId} = owerProps;
	let rules = state.getIn(['hosts', groupId, "branch", branchId, "rules"]) || new List();
	return {
		rules
	};
}

function mapDispatchToProps(dispatch) {
	return {
		addRule: bindActionCreators(addRule, dispatch),
		delRule: bindActionCreators(delRule, dispatch),
		toggleRuleDis: bindActionCreators(toggleRuleDis, dispatch),
		updateRule: bindActionCreators(updateRule, dispatch)
	};
}
export default connect(mapStateToProps, mapDispatchToProps)(EditRules);
