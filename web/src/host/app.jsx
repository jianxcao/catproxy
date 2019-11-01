import React, { PropTypes } from 'react';
import { render } from 'react-dom';
import ReactDom from 'react-dom';
import { Provider, connect } from 'react-redux';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import polyfill from '../lib/polyfill';
import LayOut from './layout';
// import Test from './test';
import style from './app.less';

import store from './store/store';
import * as actions from './action/actions';
import DialogProvider from './dialogProvider';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

class App extends React.Component {
	constructor(props) {
		super(props);
	}
	componentDidMount() {
		store.dispatch(actions.fetchRule()).then(action => {
			if (action.type === 'FETCH_SUCC') {
				store.dispatch(actions.resetHosts(action.result.result.hosts));
				store.dispatch(actions.disCache(action.result.result.disCache));
				store.dispatch(actions.cacheFlush(action.result.result.cacheFlush));
				store.dispatch(actions.remoteUpdateRuleUrl(action.result.result.remoteRuleUrl));
			}
		});
	}
	getChildContext() {
		return {
			muiTheme: getMuiTheme(baseTheme),
		};
	}
	static childContextTypes = {
		muiTheme: PropTypes.object.isRequired,
	};

	render() {
		return <LayOut />;
	}
}

ReactDom.render(
	<MuiThemeProvider>
		<Provider store={store}>
			<DialogProvider>
				<App />
			</DialogProvider>
		</Provider>
	</MuiThemeProvider>,
	document.getElementById('g-wrap')
);
