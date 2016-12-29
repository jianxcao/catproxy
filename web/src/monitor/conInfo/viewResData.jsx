import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import merge from 'lodash/merge';
import {Provider,connect } from 'react-redux';
import {bindActionCreators} from 'redux';
import {fetchConData} from '../action/fetchAction';
import {loadingConData} from '../action/loadingAction';
import Loading from '../loading';
import cx from 'classnames';
import Immutable, {List, Map} from 'immutable';
const isImage = /^image\/.+/;
class ViewResData extends Component {
	constructor() {
		super();
	}
	static propTypes = {
		data: PropTypes.object.isRequired,
		sendFetchConData: PropTypes.func,
		sendLoadingConData: PropTypes.func,
		loading: PropTypes.object,
		resBodyData: PropTypes.object
	}
	static defaultProps = {
		resBodyData: null
	}
	componentWillMount() {
		let {sendFetchConData, data, sendLoadingConData} = this.props;
		let id = data.get('resBodyDataId');
		let status = data.get('status');
		this.state = {
			loading: new Map(),
			resBodyData: null
		};
		// 首次进入的时候发送请求
		// 米有id有2种情况，一种是没有数据，一种是加载还没有返回成功
		if (id) {
			sendFetchConData(id);
		} else {
			if (!status) {
				sendLoadingConData(true);
			}
		}
	}
	
	render() {
		let {data, resBodyData, loading} = this.props;
		let isResinary = data.get('isResinary');
		let resHeaders = data.get('resHeaders');
		let id = data.get('resBodyDataId');
		let loadingConData = loading.get('loadingConData');
		let defText = <span className="dataNoParse">二进制数据!!!</span>;
		let result = "";
		// 数据已经单独冲后台加载成功 -- 并且就是当前打开tab得数据
		if (resBodyData && resBodyData.data && resBodyData.id && resBodyData.id === id) {
			let t = typeof resBodyData.data;
			// 二进制数据 - 看看是不是 图片如果是图片就 处理图片，否则就返回不认识
			// 不存在id表示数据没有在后天存在
			if (isResinary) {
				if (resHeaders) {
					let contentType = resHeaders.get("content-type");
					if (isImage.test(contentType)) {
						let blob = new Blob([new Int8Array(resBodyData.data)], {'type': contentType});
						let myURl = URL.createObjectURL(blob);
						result =  (
							<div className="imagePreview">
								<img src={myURl} />
							</div>
						);
					} else {
						result =  defText;
					}
				} else {
					result =  defText;
				}
			} else {
				result =  t === "string" ? resBodyData.data : defText;
			}
		} else {
			if (loadingConData) {
				result =  <Loading className="pageLoading" />;
			}

		}
		return <div>{result}</div>;		
	}
}

function mapStateToProps(state) {
	return {
		loading: state.get('loading'),
		resBodyData: state.get('curConDetailData')
	};
}

function mapDispatchToProps(dispatch) {
	return {
		sendLoadingConData: bindActionCreators(loadingConData, dispatch),
		sendFetchConData: bindActionCreators(fetchConData, dispatch)
	};
}
export default connect(mapStateToProps, mapDispatchToProps)(ViewResData);
