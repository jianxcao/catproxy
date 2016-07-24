import React, {PropTypes} from 'react';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import AutoComplete from 'material-ui/AutoComplete';
import TextField from 'material-ui/TextField';
import { Provider,connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Immutable, {OrderedMap, Map, List} from 'Immutable';
import {
	addBranch,
	addGroup,
	disableAll
} from './action/actions';
const outPaperStyle = {
	width: "100%",
	paddingLeft: 300,
	textAlign: 'center',
	display: 'block',
	position: "relative"
};
const innerPaperStyle = {
	height: "100%",
	width: "100%",
	display: 'block',
	position: 'relative'
}
const toobarStyle ={
	paddingLeft: 20
}
//右侧主要面板
export default class Main extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			openDialog: false
		}
	}

	static propTypes = {
	  hosts: PropTypes.object.isRequired
	}

	static defaultProps = {
		hosts: new Map()
	}

	handleCloseDialog() {
		this.setState({
			openDialog: false
		});
	}

	handleOpenDialog() {
		this.setState(Object.assign({}, this.state, {
			openDialog: true
		}));
	}

	handleChangeBranch(evt, val) {
		this.setState(Object.assign({}, this.state, {
			branchName: val
		}));	
	}

	handleGroupInput(inputVal, groups) {
		var result = groups.filter(current => current.text === inputVal);
		this.setState(Object.assign({}, this.state, {
			groupName: inputVal,
			groupId: result.length ? result[0].value : null
		}));
	}

	handleGroupSelect(val) {
		this.setState(Object.assign({}, this.state, {
			groupName: val.text,
			groupId: val.value
		}));
	}

	handleDisAll() {
		console.log('in therererer');
		this.props.disableAll();
	}

	handleSave() {
		let {groupName, branchName, groupId} = this.state;
		let {addGroup, addBranch} = this.props;
		if (groupName && branchName) {
			//groupid为null就新建分支
			addBranch(groupId, groupName, branchName);
			this.setState({
				openDialog: false
			});
		} else {
			alert('分支名称和分组名称是必须得');
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		return this.state.openDialog !== nextState.openDialog;      
	}

	renderDialog() {
		const contentStyle = {
			width: '500px',
			maxWidth: 'none',
			textAlign: 'center',
			overflow: "hidden"
		};
		const bodyStyle = {
			padding: "12px",
			minWidth: "200px"
		}
		const actions = [
			<FlatButton
				label="取消"
				primary={true}
				onTouchTap={this.handleCloseDialog.bind(this)}
			/>,
			<FlatButton
				label="保存"
				primary={true}
				keyboardFocused={true}
				onTouchTap={this.handleSave.bind(this)}
			/>
		];
		let source = this.groups = this.props.hosts.map((current, index) => {
			return {
				text: current.get('name'),
				value: index
			}
		}).toJS()
		return (<Dialog
			actions={actions}
			modal={true}
			open={this.state.openDialog}
			contentStyle={contentStyle}
			autoScrollBodyContent={true}
			bodyStyle={bodyStyle}
			>
				<AutoComplete
					floatingLabelText="分组名称"
					ref="grounEle"
					filter={AutoComplete.caseInsensitiveFilter}
					dataSource={source}
					maxSearchResults={5}
					openOnFocus={true}
					onUpdateInput = {this.handleGroupInput.bind(this)}
					onNewRequest={this.handleGroupSelect.bind(this)}
				/><br/>
				<TextField
					ref="branchEel"
					floatingLabelText="规则名称"
					type="text"
					onChange={this.handleChangeBranch.bind(this)}
				/>
		</Dialog>);
	}
	render() {
		return (
			<Paper style={outPaperStyle} zDepth={0} >
				<Paper style={innerPaperStyle} zDepth={0}>
					<Toolbar style={toobarStyle}>
						<ToolbarGroup firstChild={false}>
							<ToolbarTitle text="操作" />
							<RaisedButton label="新建" primary={true} onClick={this.handleOpenDialog.bind(this)}/>
							<RaisedButton label="禁用全部" primary={true} onClick={this.handleDisAll.bind(this)}/>
						</ToolbarGroup>
						<ToolbarGroup>
							<RaisedButton label="保存" primary={true} />
						</ToolbarGroup>
					</Toolbar>
					{this.renderDialog()}
				</Paper>
			</Paper>
		)
	}
}
function mapStateToProps(state) {
	return {
		hosts: state.get('hosts')
	}
}
function mapDispatchToProps(dispatch) {
	return {
		addBranch: bindActionCreators(addBranch, dispatch),
		addGroup: bindActionCreators(addGroup, dispatch),
		disableAll: bindActionCreators(disableAll, dispatch)
	};
}
export default connect(mapStateToProps, mapDispatchToProps)(Main);
