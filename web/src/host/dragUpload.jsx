import Paper from 'material-ui/Paper';
import checkHosts from './checkRule';
import React,{PropTypes} from 'react';
const paperStyle = {
	height: "150px",
	lineHeight: "150px",
	margin: "10px 0px"
};
let isPrev = false;
let prevDef = e => e.preventDefault();
class DragUpload extends React.Component {
	constructor(props) {
		super(props);
		if (this.props.content) {
			this.state = {
				content: this.props.content
			};
		} else {
			this.state = {
				content: "拖拽上传"
			};
		}
	}
	static propTypes = {
		dialog: React.PropTypes.func,
		toast: React.PropTypes.func,
		getReader: React.PropTypes.func
	}
	componentWillReceiveProps(nextProps) {
		if (nextProps.content) {
			this.state = {
				content: nextProps.content
			};
		}	      
	}

	dragUploadEvt(){
		let com = this;
		let {toast, getReader, dialog} = this.props;
		if (!isPrev) {
			document.addEventListener("dragleave", prevDef);
			document.addEventListener("drop", prevDef);
			document.addEventListener("dragenter", prevDef);
			document.addEventListener("dragover", prevDef);
		}
		return {
			// onDragEnter: (e)=> {
			// 	console.log('hhhhhhh', e);
			// 	e.preventDefault();
			// 	e.stopPropagation();
			// 	return false;
			// },
			// onDragOver: (e)=> {
			// 	e.preventDefault();
			// 	e.stopPropagation();
			// 	return false;
			// },
			onDrop: (e) => {
				e.preventDefault();
				var files = e.dataTransfer.files;
				if (files) {
					if (files.length > 1) {
						return toast('只能上传一个文件');
					}
					if (files[0].size > 1024 * 3000) {
						return toast('文件大小超过限制');
					}
					let file = files[0];
					// 如果已经上传完成
					if (com.reader && com.reader.rules) {
						dialog({
							msg: "已经有上传的文件，确定覆盖吗",
							onBtnClick: (btnId) => {
								if (btnId) {
									com.createReader(file);
								}
							}
						});
					} else {
						com.createReader(file);
					}
				}
			}
		};
	}
	createReader(file) {
		let {toast, getReader, dialog} = this.props;
		let com = this;
		let reader = new FileReader();
		com.reader = reader;
		getReader(reader);
		let loaded = 0;
		let total = file.size;
		reader.readAsText(file);
		reader.onloadstart = () => {
			com.setState({
				content: "开始上传"
			});
		};
		reader.onprogress = () => {
			com.setState({
				content: "缓存完成%" + (loaded / total) * 100
			});     
		};
		reader.onabort = () => {
				
		}; 
		reader.onerror = () => {
			com.setState({
				content: "上传出错"
			});
		}; 
		reader.onload = (e) => {
			let result = reader.result;
			try {
				result = JSON.parse(result);
				if (!checkHosts(result)) {
					com.setState({
						content: "文件解析失败"
					});
					return;
				}
			} catch(e) {
				console.error(e.message, e.stack);
				com.setState({
					content: "文件解析失败"
				});
				return;
			}
			reader.rules = result;
			com.setState({
				content: "缓存完成, 点击确定保存到服务器"
			});
		};
	}

	render() {
		return <Paper zDepth={2} style={paperStyle} {...this.dragUploadEvt()}>{this.state.content}</Paper>;
	}
}
export default DragUpload;



