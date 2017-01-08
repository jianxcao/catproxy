import ReactDom, {render} from 'react-dom';
import React, {PropTypes, Component} from 'react';
import Immutable, {OrderedMap, Map, List} from 'immutable';
import store from './store/store';
import {Provider,connect } from 'react-redux';
import {bindActionCreators} from 'redux';
import injectTapEventPlugin from 'react-tap-event-plugin';
import style from './monitor.less';
import MyNav from "./nav";
import FilterBar from "./filterBar";
import DataList from './dataList';
import filterListFeild from './filterListFeild';
import RightMenuProvider from './rightMenuProvider';
import ToolTipProvider from './toolTipProvider';
import Loading from './loading';
import {fetchConfig} from './action/fetchAction';
import {clearMonitorList} from './action/monitorListAction';
import {monitorStatus} from './action/navAction';
import {isRegStr, isDataUrl} from './util';
import ws from '../ws/ws';
import Scrollbars from './scrollBar';
injectTapEventPlugin();
const pageUrl = window.config.host + "/m";
class Monitor extends Component{
	constructor(props) {
		super(props);
	}
	static propTypes ={
		sendFetchConfig: PropTypes.func.isRequired,
		loading: PropTypes.object.isRequired,
		monitorStatus: PropTypes.bool.isRequired,
		monitorFilterType: PropTypes.string.isRequired,
		monitorFilterCondition: PropTypes.string.isRequired,
		hiddenDataUrl: PropTypes.bool.isRequired
	}
	static defaultProps = {
		monitorFilterCondition: "",
		monitorFilterType: "all",
		hiddenDataUrl: false,
		monitorList: {}
	}

	componentDidMount () {
		// 重新连接，清空数据
		ws().then(function(wws) {
			wws.on('disconnect', function() {
				store.dispatch(clearMonitorList());
			});
		});		
		document.body.querySelector('#g-wrap').addEventListener('contextmenu', (e) => {
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
		this.props.sendFetchConfig();
	}
	converData() {
		// 根据条件过滤数据
		let {
			monitorList,
			monitorFilterType,
			monitorFilterCondition,
			hiddenDataUrl,
		} = this.props;
		monitorFilterCondition = monitorFilterCondition.split(',');
		monitorFilterCondition = monitorFilterCondition.map((current) => {
			return isRegStr.test(current) ? new RegExp(current.slice(1,current.length - 1)) : new RegExp(current);
		});
		let mySeq = monitorList.get('mySeq');
		if (mySeq && mySeq.size) {
			return mySeq.reduce((result, id) => {
				let one = monitorList.get(id);
				let name = one.get('name');
				let type = one.get('type');
				let status =  !(hiddenDataUrl && isDataUrl.test(name)) && 
				(monitorFilterType === "all" ? true : type === monitorFilterType) &&
				(monitorFilterCondition.length ? monitorFilterCondition.some(current => current.test(name)) : true);
				if (status) {
					result = result.push(one);
				}
				return result;
			}, new List());			
		}
		return new List();
	}
	render() {
		let out;
		let {loading, monitorList, monitorStatus} = this.props;
		let loadingPage = loading.get('loadingPage');
		monitorList = this.converData();	
		if (loadingPage) {
			out = <Loading className="pageLoading"/>;
		} else {
			out = (<RightMenuProvider>
					<ToolTipProvider>
						<div>
							<MyNav/>
							<FilterBar/>
							<DataList 
								monitorStatus={monitorStatus} 
								monitorList={monitorList} 
								filterListFeild={filterListFeild}
								/>
						</div>
						</ToolTipProvider>
				</RightMenuProvider>);
		}
		return out;
	}
}
function mapStateToProps(state) {
	return {
		loading: state.get('loading'),
		monitorStatus: state.get('monitorStatus'),
		monitorFilterType: state.get('monitorFilterType'),
		monitorFilterCondition: state.get('monitorFilterCondition'),
		hiddenDataUrl: state.get('hiddenDataUrl'),
		monitorList: state.get('monitorList')		
	};
}
function mapDispatchToProps(dispatch) {
	return {
		sendFetchConfig: bindActionCreators(fetchConfig, dispatch)
	};
};
const ConnectMonitor = connect(mapStateToProps, mapDispatchToProps)(Monitor);
ReactDom.render(
	<Scrollbars autoHide={true} hideTracksWhenNotNeeded={true}>
	<Provider store={store}>
		<ConnectMonitor/>
	</Provider></Scrollbars>, 
	document.getElementById('g-wrap'));
