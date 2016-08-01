/**
 * 做一个连接器用来控制下面所有的节点可以拖动
*/
var dragEle = null;
let guid = 10101;
let getGuid = () => {
	return guid++;
}
export default (callback) => {
	let currentId = getGuid();
	//拖拽相关
	return {
		["data-drag-id"]: currentId,
		draggable: true,
		onDragStart (ev) {
			let target = ev.target;
			ev.dataTransfer.effectAllowed = "move";
			if (ev.dataTransfer.setDragImage) {
				ev.dataTransfer.setDragImage(target, 0, 0);
			}
			dragEle = target;
			ev.dataTransfer.setData("Text", target.getAttribute('data-drag-id'));
			return true;
		},

		onDragEnd (ev){
			try {
				ev.dataTransfer.clearData("Text");
				dragEle = null;
			} catch(e) {

			}
			return false;
		},

		onDragOver(ev) {
			ev.preventDefault();
			return true;
		},

		onDragEnter(ev){
			return true;
		},

		onDrop(ev){
			var dragId = ev.dataTransfer.getData("Text");
			var target = ev.target;
			let isHaveSameParent = false;
			if (!isHaveSameParent) {
				let dropId;
				while(target) {
					if (dropId = target.getAttribute('data-drag-id')) {
						if (dropId === dragId) {
							isHaveSameParent = true;
						}
						break;
					}
					target = target.parentElement;
				}
			}
			//父节点 相同即可以拖动
			if (isHaveSameParent) {
				if (callback) {
					callback(dragEle, target);
				}
			}
		}
	}
}
