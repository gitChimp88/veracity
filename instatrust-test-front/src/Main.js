import React, { Component } from 'react';
// import routes from './routes.js';


import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  withRouter
} from 'react-router-dom'
import  _  from 'lodash';
import { isEmpty } from 'lodash';

import HomePage from './components/HomePage';
import LoginPage from './containers/LoginPage';
import LogoutFunction from './containers/LogoutFunction';
import SignUpPage from './containers/SignUpPage';
import DashboardPage from './containers/DashboardPage';
import Auth from './modules/Auth';
import Heroes from './components/Heroes';

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={props => (
    Auth.isUserAuthenticated() ? (
      <Component {...props} {...rest} />
    ) : (
      <Redirect to={{
        pathname: '/login',
        state: { from: props.location }
      }}/>
    )
  )}/>
)

const LoggedOutRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={props => (
 Auth.isUserAuthenticated() ? (
      <Redirect to={{
        pathname: '/',
        state: { from: props.location }
      }}/>
    ) : (
      <Component {...props} {...rest} />
    )
  )}/>
)

const PropsRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={props => (
    <Component {...props} {...rest} />
  )}/>
)

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      authenticated: false
    }
  };
   componentDidMount() {
    console.log('component mounted!')
    // check if user is logged in on refresh
     this.toggleAuthenticateStatus()
  }

   toggleAuthenticateStatus = async () => {
    // check authenticated status and toggle state based on that
    console.log('toggleAuthenticateStatus()!');
     await this.setState({ authenticated: await Auth.authed() })
  }
/*   componentDidMount() {
    this.checkIfAuthenticated()
    .then(res => this.setState({ authenticated: res }))
    .catch(err => console.log(err));
  }
  checkIfAuthenticated = async () => {
    // await response of fetch call
    let response = await fetch('https://localhost:3000/myauth/isloggedin', 
      {
        headers: { "Content-Type": "application/json; charset=utf-8"}
      }
    );
    // only proceed once promise is resolved
     let data = response.json();
    if (response.status !== 200) throw Error(response.message);
    // only proceed once second promise is resolved
    console.log('\n\n\nresponse header.get(\'Content-Type\') = ', response.headers.get('Content-Type'));
    console.log('response.headers.get(\'Date\') = ', response.headers.get('Date'));
    console.log('response.status = ', response.status);
    console.log('response.statusText = ', response.statusText);
    console.log('response.type = ', response.type);
    console.log('response.url = ', response.url);
    console.log('data gotten from authed = ', data)
    const isUserLoggedIn = !isEmpty(data);
    console.log(' returned from authed(), isUserLoggedIn = ', isUserLoggedIn);
    return isUserLoggedIn;
  } */


  
/*  EXPERIMENT:
  // check if user is logged in on refresh
  componentDidMount() {
    // check authenticated status and toggle state based on that
    Auth.toggleAuthenticateStatus()
    .then(data => {
      console.log('from componentDidMount(), data = ', data)
      const isUserLoggedIn = !isEmpty(data);
      console.log('from ccomponentDidMounr(), isUserLoggedIn = ', isUserLoggedIn);

      this.setState({ authenticated: isUserLoggedIn})
    })
    .catch(reason => console.log(reason.message));
  } 
 */
  render() {
    return (
        <Router>
          <div>
            <div>
              <div>
                <Link to="/">"/" Route Link</Link>
                <Link to="/heroes">   /heroes</Link>
              </div>
              {this.state.authenticated ? (
                <div className="links">
                  <Link to="/">   /homepage</Link>
                  <Link to="/dashboard">   /dashboard</Link>
                  <Link to="/heros">   /heroes</Link>
                  <Link to="/logout">    /logout</Link>
                </div>
              ) : (
                <div className="links">
                  <a href="/login"> Login </a>
                  <Link to="/signup">/signup</Link>
                </div>
              )}

            </div>

            <PropsRoute exact path="/" component={HomePage} toggleAuthenticateStatus={this.toggleAuthenticateStatus} /> 
            <PrivateRoute path="/dashboard" component={DashboardPage}/> 
            {/* <PrivateRoute path="/heroes" component={Heroes}/> */}
            <LoggedOutRoute path="/login" component={LoginPage} toggleAuthenticateStatus={this.toggleAuthenticateStatus} />
            <LoggedOutRoute path="/signup" component={SignUpPage}/>
            <Route path="/logout" component={LogoutFunction}/>
            <Route path="/heroes" component={Heroes}/>
            
          </div>

        </Router>
    );
  }
}

export default Main;
  