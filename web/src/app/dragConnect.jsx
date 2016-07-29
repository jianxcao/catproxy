/**
 * 做一个连接器用来控制下面所有的节点可以拖动
*/

export default () => {
		//拖拽相关
	return {
		["data-drag-id"]: +new Date(),
		onDragStart (ev) {
			ev.dataTransfer.effectAllowed = "move";
			ev.dataTransfer.setData("Text", ev.target.getAttribute('data-drag-id'));
			return true;
		},

		onDragEnd (ev){
			ev.dataTransfer.clearData("Text");
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
				console.log(ev, this);
			}
		}
	}
}
