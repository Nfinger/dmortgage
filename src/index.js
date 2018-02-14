import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from 'react-router'
import { Provider } from 'react-redux'
import { syncHistoryWithStore } from 'react-router-redux'
import { UserIsAuthenticated, UserIsNotAuthenticated } from './util/wrappers.js'
import getWeb3 from './util/web3/getWeb3'
import AuthenticationContract from '../build/contracts/Authentication.json'

const contract = require('truffle-contract')

// Layouts
import App from './App'
import Home from './layouts/home/Home'
import Dashboard from './layouts/dashboard/Dashboard'
import AddItem from './layouts/addItem/AddItem'
import ItemDetails from './layouts/itemDetails/ItemDetails'
import SignUp from './user/layouts/signup/SignUp'
import Profile from './user/layouts/profile/Profile'

// Redux Store
import store from './store'

// Initialize react-router-redux.
const history = syncHistoryWithStore(browserHistory, store)

export const USER_LOGGED_IN = 'USER_LOGGED_IN'
function userLoggedIn(user) {
  return {
    type: USER_LOGGED_IN,
    payload: user
  }
}

// Initialize web3 and set in Redux.
getWeb3
.then(results => {
  console.log('Web3 initialized!')
  const web3 = results.payload.web3Instance
  // Using truffle-contract we create the authentication object.
  const authentication = contract(AuthenticationContract)
  authentication.setProvider(web3.currentProvider)

  // Declaring this for later so we can chain functions on Authentication.
  var authenticationInstance

  // Get current ethereum wallet.
  web3.eth.getCoinbase((error, coinbase) => {
    // Log errors, if any.
    if (error) {
      console.error(error);
    }

    authentication.deployed().then(function(instance) {
      authenticationInstance = instance

      // Attempt to login user.
      authenticationInstance.login({from: coinbase})
      .then(function(result) {
        // If no error, login user.
        var userName = web3.toUtf8(result)
        store.dispatch(userLoggedIn({"name": userName}))
      })
      .catch(function(result) {
        // If error, go to signup page.
        console.error('Wallet ' + coinbase + ' does not have an account!')

        return browserHistory.push('/signup')
      })
    })
  })
})
.catch(() => {
  console.log('Error in web3 initialization.')
})

ReactDOM.render((
    <Provider store={store}>
      <Router history={history}>
        <Route path="/" component={App}>
          <IndexRoute component={Home} />
          <Route path="addItem" component={UserIsAuthenticated(AddItem)} />
          <Route path="dashboard" component={UserIsAuthenticated(Dashboard)} />
          <Route path="signup" component={UserIsNotAuthenticated(SignUp)} />
          <Route path="profile" component={UserIsAuthenticated(Profile)} />
          <Route path="/item/:id" component={ItemDetails} />
        </Route>
      </Router>
    </Provider>
  ),
  document.getElementById('root')
)
