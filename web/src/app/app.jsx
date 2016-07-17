import React, {PropTypes} from 'react';
import {render} from 'react-dom';
import ReactDom from 'react-dom';

import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';


import AppBar from './app-bar';
// import ListView from './list';
// import Test from './test';
import style from './app.less';


import store from './store/store';
import * as actions from './action/actions';

store.dispatch(actions.addGroup("cjx"));
store.dispatch(actions.changeGroupName(0, "www"));
store.dispatch(actions.addBranch(0, "test"));
store.dispatch(actions.changeBranchName(0, 0, "bbb"));
window.actions = actions;
// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

class App extends React.Component {
	constructor(props) {
		super(props);
	}
  getChildContext() {
    return {
    	muiTheme: getMuiTheme(baseTheme)
    };
  }
	static childContextTypes = {
	  muiTheme: PropTypes.object.isRequired
	};
	render() {
		return (
			<div></div>
		)
	};
}

ReactDom.render(
	<MuiThemeProvider>
		<App/>
	</MuiThemeProvider>, 
document.getElementById('g-wrap'))
