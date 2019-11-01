import ReactDom, { render } from 'react-dom';
import React, { PropTypes, Component, Children } from 'react';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import JsonNode from './jsonNode';
import reduce from 'lodash/reduce';
const renderContent = function(json, isUrlDecode, index, propKey) {
	let jsonIsArr = isArray(json);
	// 不是一个plainObject全部忽略
	if (isPlainObject(json) || jsonIsArr) {
		let is = isArray(json);
		let i = 1;
		let result = reduce(
			json,
			function(result, val, key) {
				let type = typeof val;
				let suo = index + '_' + i;
				let showKey = is ? key + '' : `"${key}"`;
				if (type === 'object') {
					result.push(renderContent(val, isUrlDecode, suo, showKey));
				} else if (type === 'string') {
					if (isUrlDecode) {
						val = decodeURIComponent(val);
					}
					result.push(
						<div className='jData' key={suo} data-key={suo}>
							<span className='key'>{showKey}</span>:<span className='str'>"{val}",</span>
						</div>
					);
				} else if (type === 'number') {
					result.push(
						<div className='jData' key={suo} data-key={suo}>
							<span className='key'>{showKey}</span>:<span className='num'>{val},</span>
						</div>
					);
				}
				i = i + 1;
				return result;
			},
			[]
		);
		return (
			<JsonNode type={is ? 'array' : 'object'} key={index} data-key={index} propKey={propKey}>
				{result}
			</JsonNode>
		);
	}
	return '';
};
export default class JsonTreeView extends Component {
	static propTypes = {
		json: PropTypes.object.isRequired,
		isUrlDecode: PropTypes.bool,
	};
	static defaultProps = {
		isUrlDecode: true,
	};
	render() {
		let { json, isUrlDecode } = this.props;
		return <div className='jsonTree'>{renderContent(json, isUrlDecode, 0)}</div>;
	}
}
