import {Table, Column, Cell}  from 'fixed-data-table';
import ReactDom, {render} from 'react-dom';
import React, {PropTypes, Component, Children } from 'react';
import HeaderCell from './headerCell';
import {computeColumnWidth, adjustColumnWidth} from './cellWidthHelper';
import style from "fixed-data-table/dist/fixed-data-table-base.css";
import {Provider,connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {monitorStatus} from './action/navAction';
import {upperFirstLetter} from './util';
import cs from 'classnames';
import ConInfo from './conInfo/conInfo';
const clsChec = /[^\x20\t\r\n\f]+/g ;
const getDomainReg = /:\/\/([^:\/]+)/;
const wrongCodeReg = /(^4)|(^5).+/;
export default class DataList extends Component {
	constructor(props) {
		super(props);
		this._update = this._update.bind(this);
		this._onResize = this._onResize.bind(this);
		this._onColumnResizeEndCallback = this._onColumnResizeEndCallback.bind(this);
		this._onRowMouseEnter = this._onRowMouseEnter.bind(this);
		this._onRowMouseLeave = this._onRowMouseLeave.bind(this);
		this._onRowMouseDown = this._onRowMouseDown.bind(this);
		this.getTextCell = this.getTextCell.bind(this);
		this._onHeaderCellMouseDown = this._onHeaderCellMouseDown.bind(this);
		this._changeFilterList = this._changeFilterList.bind(this);
		this._onScrollStart = this._onScrollStart.bind(this);
		this._onDargDetailResize = this._onDargDetailResize.bind(this);
		this.closeDetailCon = this.closeDetailCon.bind(this);
		// 打开详情的宽度
		this._conInfoWidth = null;
	
	}
	static propTypes = {
		filterListFeild: PropTypes.array.isRequired,
		minCellWidth: PropTypes.number,
		minTableWidth: PropTypes.number,
		minTableHeight: PropTypes.number,
		monitorStatus: PropTypes.bool.isRequired,
		// 这里必须是一个list
		monitorList: PropTypes.object.isRequired
	};
	static defaultProps = {
		minCellWidth: 80,
		minTableWidth: 800,
		minTableHeight: 500,
		rowSelect: -1
	}
	static contextTypes = {
		openRightMenu: PropTypes.func.isRequired,
		closeRightMenu: PropTypes.func.isRequired
	}
	componentWillMount() {
		this.init();
	}
	
	componentDidMount() {
		var win = window;
		if (win.addEventListener) {
			win.addEventListener('resize', this._onResize, false);
		} else if (win.attachEvent) {
			win.attachEvent('onresize', this._onResize);
		} else {
			win.onresize = this._onResize;
		}
		let width = +localStorage.getItem('conInfoWidth');
		if (width > 0) {
			this._conInfoWidth = width;
		}
	}
	componentDidUpdate(prevProps, prevState) {
		// 组件更新后保存宽度
		let refs = this.refs;
		let customColums = this.state.customColums;
		customColums.forEach(function(current) {
			let key  = current.shortName + "Header";
			if (refs[key] && refs[key].props && refs[key].props.width) {
				current.width = refs[key].props.width;
			}
		});
		localStorage.setItem("customColums", JSON.stringify(customColums));
	}
	// 初始化
	init() {
		let tableWidth = window.innerWidth;
		let tableHeight = window.innerHeight;
		let {filterListFeild, minCellWidth, minTableHeight, rowSelect} = this.props;
		let showFeild;
		// 从本地取到列，要显示的列和列的宽度
		let customColums = localStorage.getItem("customColums");
		if (customColums) {
			try{
				customColums = JSON.parse(customColums);
			} catch(e) {
				customColums = [];
			}
		} else {
			customColums = [];
		}
		// 存在用户自定义记录
		if (customColums.length) {
			showFeild = customColums;
		} else {
			showFeild = computeColumnWidth(filterListFeild, minCellWidth, tableWidth);
		}
		tableHeight = Math.max(tableHeight - 66, minTableHeight);
		rowSelect = + rowSelect;
		if (!(rowSelect > -1)) {
			rowSelect = -1;
		}		
		this.state = {
			tableHeight: tableHeight,
			tableWidth: tableWidth,
			hoverIndex: -1,
			customColums: showFeild,
			rowSelect
		};
	}
	componentWillReceiveProps (nextProps) {
		let {monitorList} = this.props;
		if (monitorList.size === 0) {
			this.setState({
				rowSelect: -1
			});
		}
	}
	
	getTextCell ({rowIndex, columnKey: key, ...props}) {
		let {monitorList} = this.props;
		let data = monitorList.get(rowIndex);
		let result;
		let status = data.get("status") || "";
		let className = cs({
			 "wrong_color": wrongCodeReg.test(status),
			 "row_select": this.state.rowSelect === rowIndex
		});
				
		if (key === 'status' || key === 'size' || key === "time") {
			result = data.get(key);
			if (result === undefined || result === null) {
				result = "Pending";
			}
		} else if (key === 'domain') {
			result = (data.get("name") || "").match(getDomainReg);
			if (result && result.length > 0) {
				result = result[1];
			} else {
				result = "";
			}
		} else {
			result = data.get(key);
		}
		let myProp = {...props};
		if (key === 'name') {
			myProp['data-tip'] = result;
		}
		return (
			<Cell {...myProp} className={className}>{result}</Cell>
		);
	}
	// 调整列宽度
	_onColumnResizeEndCallback(newColumnWidth, columnKey) {
		if (!columnKey) {
			return;
		}
		let lockColum = this.state.customColums.filter(current => current.shortName === columnKey);
		// 更新新的 宽度
		lockColum[0].width = newColumnWidth;
		let {customColums, tableWidth} = this.state;
		let {minCellWidth} = this.props;
		// 从新更新一次tab的height
		this.setState({
			//  调整宽度到合适得大小
			customColums: adjustColumnWidth(customColums, minCellWidth, tableWidth, columnKey)
		});
	}
	// 页面大小发生变化
	_onResize() {
		clearTimeout(this._updateTimer);
		this._updateTimer = setTimeout(this._update, 16);
	}
	// 页面大小发生变化
	_update() {
		var win = window;
		let {customColums, tableHeight, tableWidth} = this.state;
		let {minTableWidth, minCellWidth, minTableHeight} = this.props;
		let newWidth = win.innerWidth;
		if (newWidth < minTableWidth) {
			newWidth = minTableWidth;
		}
		let newHeight = win.innerHeight - 66;
		newHeight = Math.max(newHeight, minTableHeight);
		if (newHeight === tableHeight && newWidth === tableWidth) {
			return this;
		}
		// 从新更新一次tab的height
		this.setState({
			tableWidth: newWidth,
			tableHeight: newHeight,
			customColums: adjustColumnWidth(customColums, minCellWidth, newWidth)
		});
	}
	// 鼠标悬浮行
	_onRowMouseEnter(e, index) {
		let rowEle = e.currentTarget;
		let cls = "row_hover";
		let className = " " + (rowEle.className || "") + " ";
		if (className.indexOf( " " + cls + " " ) < 0) {
			rowEle.className = (className + cls).trim();
		}
	}
	// 鼠标离开行
	_onRowMouseLeave(e, index) {
		let rowEle = e.currentTarget;
		let cls = "row_hover";
		let className = " " + (rowEle.className || "") + " ";
		if (className.indexOf( " " + cls + " " ) > -1) {
			rowEle.className = (className.replace(" " + cls + " ", "")).trim();
		}		
	}
	// 鼠标按下 某一行，弹出右键菜单
	_onRowMouseDown(e, index) {
		let {monitorStatus, monitorList} = this.props;
		let data = monitorList.get(index);
		if (e.button == 2) {
			let domain = (data.get("name") || "").match(getDomainReg);
			if (domain && domain.length > 0) {
				domain = domain[1];
			} else {
				domain = "";
			}		
			let menus =  [{
				text: "复制url",
				eventKey: "copyUrl",
				copy: data.get("name")
			},{
				text: "复制域名",
				eventKey: "copyDomain",
				copy: domain
			},{
				divider: true
			},{
				text: "复制请求头",
				eventKey: "copyReqHeader",
				copy: data.get('reqHeaders').toJS()
			},{
				text: "复制响应头",
				eventKey: "copyResHeader",
				copy: data.get('resHeaders').toJS()
			}];
			this.context.openRightMenu({
				left: e.clientX,
				top: e.clientY,
				menuItems: menus
			});
		} else {
			let id = data.get('id');
			if (!id) {
				return this;
			}
			this.setState({
				rowSelect: index
			});
		}
	}
	// 修改显示字段
	_changeFilterList(e) {
		let ele = e.target;
		let name = ele.name;
		let {customColums, tableWidth} = this.state;
		let {filterListFeild, minCellWidth} = this.props;
		// 增加了一列
		if (ele.checked) {
			let totalFlex = 0;
			// 转成 map
			let have = customColums.reduce((all, current) => {
				all[current.shortName] = current;
				totalFlex += +current.flex || 1;
				return all;
			}, {});
			// 找元素
			customColums = filterListFeild.reduce((all, current) => {
				if (current.shortName === name) {
					let flex = +current.flex || 1;
					totalFlex += flex;
					all.push({
						...current,
						// 新增加的列宽度默认最小宽度
						width: flex/totalFlex * tableWidth
					});
				}
				if (have[current.shortName]) {
					all.push(have[current.shortName]);
				}
				return all;
			}, []);
			this.setState({
				customColums: adjustColumnWidth(customColums, minCellWidth, tableWidth)
			});			
		} else {
			// 只有一列的时候不准删除
			if (customColums.length === 1) {
				e.target.checked = "checked";
				return;
			}
			// 删除掉1列
			var index;
			for (let i = 0; i < customColums.length; i++) {
				if (customColums[i].shortName === name) {
					index = i;
					break;
				}
			}
			if (index >= 0) {
				customColums.splice(index, 1);
			}
			this.setState({
				customColums: adjustColumnWidth(customColums, minCellWidth, tableWidth)
			});			
		}
	}
	// 鼠标按下某一表格头部，弹出右键菜单
	_onHeaderCellMouseDown(e) {
		let {customColums} = this.state;
		let {filterListFeild} = this.props;
		if (e.button == 2) {
			let have = customColums.reduce((all, current) => {
				all[current.shortName] = true;
				return all;
			}, {});
			let menuItems = filterListFeild.reduce((all, current, index) => {
				let checked = !!have[current.shortName];
				if (index % 3 === 0 && index !== 0) {
					all.push({
						divider: true
					});
				}
				all.push({
					text: [
						<input type="checkbox" 
						name={current.shortName} 
						defaultChecked={checked} key={1} 
						onChange={this._changeFilterList} 
						id={"MenuItem" + current.shortName} 
						/>, 
						<label key={2} htmlFor={"MenuItem" + current.shortName} >{current.name}</label>],
					eventKey: current.shortName
				});
				return all;
			}, []);
			this.context.openRightMenu({
				left: e.clientX,
				top: e.clientY,
				menuItems,
				className: "filterColumMenu",
				menuClickEvt: () => false
			});
		}
	}
	// 开始滚动则关闭右键菜单
	_onScrollStart(e) {
		let {closeRightMenu} = this.context;
		closeRightMenu();
		return false;
	}
	// 详情页面拖拽改大小
	_onDargDetailResize(width) {
		this._conInfoWidth = width;
		if (this.__dargDetailResizeTimer) {
			window.clearTimeout(this.__dargDetailResizeTimer);
		}
		this.__dargDetailResizeTimer = window.setTimeout(() => {
			localStorage.setItem('conInfoWidth', this._conInfoWidth);
		}, 500);
	}
	closeDetailCon() {
		let {rowSelect} = this.state;
		if (rowSelect && rowSelect != -1) {
			this.setState({
				rowSelect: -1
			});
		}
	}
	render() {
		let {tableWidth, tableHeight, customColums, rowSelect} = this.state;
		let {monitorStatus, monitorList} = this.props;
		// 没有数据的情况
		if (!monitorStatus || !monitorList || !monitorList.size) {
			let style = {
				width: tableWidth,
				height: tableHeight,
				lineHeight: tableHeight + "px"
			};
			let content = monitorStatus ? "监控已经准备好" : "点击开始录制按钮录制";
			return (<div className="dataList noData" style={style}>{content}</div>);
		}
		// 按列初始化数据
		let col = customColums.reduce((all, current, index) => {
			let width  = current.width;
			let flexGrow = +current.flexGrow || 1;
			all.push(
				<Column 
					align={"center"}
					header={<HeaderCell ref={current.shortName + "Header"} data-tip={current.tip} onMouseDown={this._onHeaderCellMouseDown}>{current.name}</HeaderCell>}
					key={index}
					columnKey={current.shortName}
					width={width}
					minWidth={80}
					isResizable={true}
					flexGrow={flexGrow}
					cell={this.getTextCell}
				/>
			);
			return all;
		}, []);
		let detail = "";
		if (rowSelect > -1 && rowSelect < monitorList.size) {
			let data = monitorList.get(rowSelect);
			let width = this._conInfoWidth || parseInt(window.innerWidth * 0.5);
			let style = {
				top: 66
			};
			if (data) {
				detail = 	<ConInfo 
					width={width} 
					height={tableHeight} 
					style={style} 
					onDargResize={this._onDargDetailResize} 
					data={data} destory= {this.closeDetailCon}></ConInfo>;
			}
		}
		return (
			<div className="dataList">
				<Table
					onColumnResizeEndCallback = {this._onColumnResizeEndCallback}
					rowsCount={monitorList.size}
					rowHeight={25}
					headerHeight={30}
					isColumnResizing={false}
					width={tableWidth}
					onRowMouseEnter={this._onRowMouseEnter}
					onRowMouseLeave={this._onRowMouseLeave}
					onRowMouseDown={this._onRowMouseDown}
					onScrollStart = {this._onScrollStart}
					height={tableHeight}>
					{col}
				</Table>
				{detail}
			</div>
		);
	}
}
