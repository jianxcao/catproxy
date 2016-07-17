import React from 'react';
import AppBar from 'material-ui/AppBar';


export default class Test extends React.Component {
	state = {
		hello: [1, 2, 3, 4, 5]
	}
	componentDidMount() {
	  let time =  setInterval(function() {
	   	let hello = this.state.hello;
	   	// if (hello.length) {
	   	// 	hello = hello.slice(0, hello.length - 1);
	   	// } else {
	   	// 	clearTimeout(time);
	   	// }
	   	// console.log(hello);
	   	hello.push(Math.floor(Math.random() * 100));
	   	this.setState(this.state);

	   }.bind(this), 1000)
	}
	shouldComponentUpdate(nextProps, nextState) {
	    return true;  
	}
	render() {
		return (<div>{this.state.hello.map((current)=> {
		 	return <em>{current}</em>;
		 })}{
		}</div>)
	}
}
