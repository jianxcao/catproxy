import React, {PropTypes} from 'react';
import {render} from 'react-dom';
import ReactDom from 'react-dom';
import * as shim from './shim';
import { Provider,connect } from 'react-redux'
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import LayOut from './layout';
// import Test from './test';
import style from './app.less';


import store from './store/store';
import * as actions from './action/actions';

store.dispatch(actions.fetchData('http://test.html'))
.then(function(data) {
	store.dispatch(actions.resetHosts(data.result.hosts))
	store.dispatch(actions.addGroup("cjx"));
	store.dispatch(actions.changeGroupName(0, "www"));
	store.dispatch(actions.addBranch(0, "test"));
	store.dispatch(actions.changeBranchName(0, 0, "bbb"));
});

window.actions = actions;
window.store = store;
window.React = React;

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

class App extends React.Component {
	constructor(props) {
		super(props);
	}
	componentDidMount() {
		
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
			<LayOut></LayOut>
		)
	};
}

ReactDom.render(
	<MuiThemeProvider>
		<Provider store={store}>
			<App/>
		</Provider>
	</MuiThemeProvider>, 
document.getElementById('g-wrap'))
