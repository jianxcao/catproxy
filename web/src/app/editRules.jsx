import React, {PropTypes} from 'react';
import Paper from 'material-ui/Paper';
import SubHeader from './subhead';
import { Provider,connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Immutable,{Map, List} from 'Immutable';
import EditRule from "./editRule";
import RaisedButton from 'material-ui/RaisedButton';
import dragCon from './dragConnect';
import {
	addRule,
	delRule,
	toggleRuleDis,
	updateRule,
	switchRule
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

	//更新某个规则
	updateRule(ruleId, rule) {
		let {groupId, branchId} = this.props;
		this.props.updateRule(groupId, branchId, ruleId, rule);
	}

	switchRule(dragEle, dropEle) {
		let {groupId, branchId} = this.props;
		let sourceId = dragEle.getAttribute("data-id");
		let id = dropEle.getAttribute("data-id");
		if (sourceId != null && id != null) {
			sourceId = + sourceId;
			id = + id;
			this.props.switchRule(groupId, branchId, sourceId, id);
		}
	}

	render() {
		let {groupId, branchId} = this.props;
		if (groupId !== null && branchId !== null && groupId >= 0 && branchId >=0) {
				let rules = this.props.rules;
				let switchProps = dragCon(this.switchRule.bind(this));
				let editRules = rules.map((current, index) => {
					return <EditRule rule={current} key={index} ruleId={index} data-id = {index} 
					delRule={this.delRule.bind(this)}
					disRule={this.disRule.bind(this)}
					updateRule={this.updateRule.bind(this)} {...switchProps} />
				});
				return (
					<Paper zDepth={0}>
						<Paper zDepth={0} style={paperStyle}>
							<RaisedButton label="新建规则" primary={true} onClick={this.newRule.bind(this)}/>
						</Paper>
						{editRules}
					</Paper>
				);
		} else {
			return (
				<Paper zDepth={0}>
					<Paper zDepth={0} style={paperStyle}></Paper>
				</Paper>
			);
		}
	}
}

function mapStateToProps(state, owerProps) {
	let {groupId, branchId} = state.get('selectRule').toJS();
	let rules = state.getIn(['hosts', groupId, "branch", branchId, "rules"]);
	//没找到对应的规则
	if (!rules) {
		rules = new List();
		groupId = null;
		branchId = null;
	}
	return {
		rules,
		groupId,
		branchId
	};
}

function mapDispatchToProps(dispatch) {
	return {
		addRule: bindActionCreators(addRule, dispatch),
		delRule: bindActionCreators(delRule, dispatch),
		toggleRuleDis: bindActionCreators(toggleRuleDis, dispatch),
		updateRule: bindActionCreators(updateRule, dispatch),
		switchRule: bindActionCreators(switchRule, dispatch)
	};
}
export default connect(mapStateToProps, mapDispatchToProps)(EditRules);
