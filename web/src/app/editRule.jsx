import React, {PropTypes} from 'react';
import Paper from 'material-ui/Paper';
import Immutable,{Map, List} from 'Immutable';
import TextField from 'material-ui/TextField';
import Divider from 'material-ui/Divider';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';

import Subheader from 'material-ui/Subheader';
//每个字段的样式
const fieldStyle = {
	marginLeft: 20,
	width: '350px',
	display: "inline-block",
	textAlign: "left"
};
//所有字段外围paper的样式
const paperStyle = {
	textAlign: "center",
	maxWidth: "800px",
	margin: "20px auto"
};
//所有规则的type和值
const rulesKeys = {
	host: "host",
	localFile: "本地文件",
	localDir: "本地目录",
	remoteFile: "远程文件"
}
const targetTips = {
	host: "请输入目标host或ip",
	localFile: "请输入目标文件绝对路径",
	localDir: "请输入目标目录绝对路径",
	remoteFile: "请输入远程文件url地址,包括参数哦"
}

const subheaderStyle = {
	textAlign: "left",
	fontSize: "16px",
	fontWeight: 700
};
//获取icon
const getIcon = (props = {}, className, style) => {
	let defStyle ={
		padding: "0px",
		width: 24,
		height: 24,
		fontSize: '24px',
		lineHeight: '24px'
	};
	let iconStyle = {
		fontSize: '16px'
	};
	style = Object.assign({}, defStyle, style);
	return 	(
		<IconButton
			{...props}
			style={style}
			iconStyle={iconStyle}
			iconClassName={"basefont " + className}
		/>
	);
};
export default class EditRule extends React.Component{
	//删除一个规则
	handleDel() {
		let {ruleId, delRule} = this.props;
		delRule(ruleId);
		
	}
	//禁止一个规则
	handleDis() {
		let {ruleId, disRule} = this.props;
		disRule(ruleId);
	}

	//修改规则的字段
	handleChange(evt, val) {
		let target = evt.target;
		let name = target.name;
		let {ruleId, updateRule} = this.props;
		updateRule(ruleId, {
			[name]: val
		});
	}
	//修改类型
	handleTypeChange(evt, index, selectVal) {
		let {ruleId, updateRule} = this.props;
		updateRule(ruleId, {
			"type": selectVal
		});	
	}

	renderIcon() {
		return [getIcon({
			key: 0,
			onClick: this.handleDel.bind(this)
		},'icon-del', {
			display: "inline-block",
		}),
		getIcon({
			key: 1,
			onClick: this.handleDis.bind(this)
		},'icon-disable', {
			display: "inline-block",
			left: '24px'
		})];	
	}

	render() {
		//按钮外围div样式
		let divStyle = Object.assign({}, fieldStyle, {
			height: "50px",
			lineHeight: "50px"
		});
		//当前的规则
		let rule = this.props.rule;
		//规则类型的下拉列表
		let menuRulesTypeList = [];
		for(let key in rulesKeys) {
			menuRulesTypeList.push(<MenuItem value={key} key={key} primaryText={rulesKeys[key]} />);
		}
		let subStyle = Object.assign({}, subheaderStyle, {
			backgroundColor: rule.get('disable') ? "#BDBDBD" : "#E0F2F1"
		});

		let props = this.props;
		let def = ['rule', 'ruleId', 'delRule', 'disRule', 'updateRule', 'switchProps'];
		let newProps = {};
		
		for(let key in props) {
			if (def.indexOf(key) < 0) {
				newProps[key] = props[key];
			}
		}
		let virtualPath = null;
		if (rule.get('type') === 'localDir') {
			virtualPath = <TextField name="virtualPath" onChange={this.handleChange.bind(this)} style={fieldStyle} underlineShow={true} fullWidth={true}  value={rule.get('virtualPath')} hintText="请输入虚拟部分路径" />
		}
		return (
			<Paper zDepth={1} style={paperStyle} {...newProps}>
				<Subheader inset={true} style={subStyle} {...this.props.switchProps} data-id={this.props.ruleId}>规则{this.props.ruleId + 1} </Subheader>
				<SelectField value={rule.get('type')} style={fieldStyle} onChange={this.handleTypeChange.bind(this)}>{menuRulesTypeList}</SelectField>
				<TextField  name="test" onChange={this.handleChange.bind(this)} style={fieldStyle} underlineShow={true} fullWidth={true}  value={rule.get('test')} hintText="请输入源地址" />
				<TextField name="exec" onChange={this.handleChange.bind(this)} style={fieldStyle} underlineShow={true} fullWidth={true}  value={rule.get('exec')} hintText={targetTips[rule.get('type')]} />
				{virtualPath}
				<div style={divStyle}>{this.renderIcon()}</div>
			</Paper>
		);
	}
}
