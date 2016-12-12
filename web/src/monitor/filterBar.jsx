import ReactDom, {render} from 'react-dom';
import React, {PropTypes, Component} from 'react';
import {Provider,connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {monitorFilterStatus} from './action/navAction';
import filterBarAction from './action/filterBarAction';
import filterBarReducer from './reducers/filterBar';
import reduce from 'lodash/reduce';
import {upperFirstLetter} from './util';
import {MONITOR_FILTER_TYPES} from './constant';
import * as sendMsg from "../ws/sendMsg";
import cs from 'classnames';
class FilterBar extends Component{
	constructor(...arg) {
		super(...arg);
		this.changeMonitorFilterType = this.changeMonitorFilterType.bind(this);
		this.changeMonitorFilterCondition = this.changeMonitorFilterCondition.bind(this);
		this.changeHiddenDataUrl = this.changeHiddenDataUrl.bind(this);
	}
	static propTypes = {
		monitorFilterType: PropTypes.string.isRequired,
		monitorFilterCondition: PropTypes.string.isRequired,
		hiddenDataUrl: PropTypes.bool.isRequired,
		monitorFilterStatus: PropTypes.bool.isRequired,

		sendMonitorFilterType: PropTypes.func.isRequired,
		sendMonitorFilterCondition: PropTypes.func.isRequired,
		sendHiddenDataUrl: PropTypes.func.isRequired
	}
	static defaultProps = {
		monitorFilterCondition: ""
	}
	// 改变监控的 类型
	changeMonitorFilterType(e) {
		let {sendMonitorFilterType} = this.props;
		sendMonitorFilterType(e.target.value);
		sendMsg.monitorFilterType(e.target.value);
	}
	// 改变监控的条件
	changeMonitorFilterCondition(e) {
		let val = e.target.value;
		let {sendMonitorFilterCondition} = this.props;
		if (this._fitlerConitionTimer) {
			window.clearTimeout(this._fitlerConitionTimer);
		}
		this._fitlerConitionTimer = window.setTimeout(() => {
			sendMonitorFilterCondition(val);
		}, 100);
	}
	// 改变是否现实 dataURL
	changeHiddenDataUrl() {
		let {sendHiddenDataUrl, hiddenDataUrl} = this.props;
		sendHiddenDataUrl(!hiddenDataUrl);
		sendMsg.hiddenDataUrl(!hiddenDataUrl);
	}
	render() {
		let {	
			monitorFilterStatus,
			monitorFilterType,
			monitorFilterCondition,
			hiddenDataUrl
		} = this.props;
		const style = {};
		if (!monitorFilterStatus) {
			style.display = "none";
		}
		let filterTypes = MONITOR_FILTER_TYPES.map((current, index) => {
			let showUserName = current === "ws" ? "WS" : upperFirstLetter(current);
			let	isChecked = monitorFilterType === current;
			return (
					<span className="type" key={index}>
						<input type="radio" name="type" id={current} value={current} 
							checked={isChecked}
							onChange={this.changeMonitorFilterType}/>
						<label htmlFor={current}>{showUserName}</label>
					</span>
				);
		});
		filterTypes.splice(1, 0, (<div className="split" key="split"></div>));
		return (
			<div className="filterBar" style = {style}>
					<div className="filter">
						<input type="text" name="filter" placeholder="过滤" defaultValue={monitorFilterCondition} onChange={this.changeMonitorFilterCondition}/>
					</div>
					<div className="filterTypes">
						{filterTypes}
					</div>
			</div>
		);
	}
}
function mapStateToProps(state) {
	return reduce(filterBarReducer, (result, current, key) => {
		result[key] = state.get(key);
		return result;
	}, {
		monitorFilterStatus: state.get('monitorFilterStatus')
	});
}
function mapDispatchToProps(dispatch) {
	return reduce(filterBarAction, (result, current, key) => {
		result["send" + upperFirstLetter(key)] = bindActionCreators(current, dispatch);
		return result;
	}, {});
};
export default connect(mapStateToProps, mapDispatchToProps)(FilterBar);

/**
<div className="hideDataUrl">
			<input type="checkbox" id="hideDataUrl"
				checked={hiddenDataUrl}
				onChange={this.changeHiddenDataUrl}/><label htmlFor="hideDataUrl">隐藏 data Urls</label>
		</div> */
