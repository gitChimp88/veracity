// -----------------------------------------------------------------------------
// This file configures the server to support authentication for Veracity APIs
// and requests the access token needed to perform requests.
// -----------------------------------------------------------------------------

/* Import our server setup code so that we can configure authentication on our 
server instance. */
const { app, readIndexFileAndSetState, start } = require('./server.js');

// Fetch authentication configuration
const { authConfig } = require('./config.js');

/*  ExpressSession is used to store session info in memory so the user does not 
have to re-authenticate on every request. */
const expressSession = require('express-session');

/*  Get the strategy we use to authenticate with Azure B2C and ADFS (it handles 
  both for us) */
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

// BodyParser is specifically used to parse the POST response from Azure B2C/ADFS.
const bodyParser = require('body-parser');
/* Helper library for performing http requests from node.js. Used to query the 
Veracity API from the server on behalf of the user. */
const request = require('request-promise-native');
// PassportJs handles authentication for us using the passport-azure-ad plug-in.
const passport = require('passport');

const api = require('./routes/api');

const helpers = require('./helpers.js');

// TODO: put authorization code below in its own middleware
// -----------------------------------------------------------------------------
/* Set up our session manager that will use in-memory storage for sessions. 
You should not use in-memory storage in production. This must be done before 
we attach the passport middleware or passport will be unable to use sessions
For a full description of these options see 
https://github.com/expressjs/session */
// -----------------------------------------------------------------------------
app.use(
  expressSession({
    secret: 'session secret', // The key phrase used to sign session cookies.
    resave: false, // Prevent resaving session data if nothing was modified.
    /* Only save sessions if they are actually initialized (i.e.: only save if 
      the user is actually authenticated) */
    saveUninitialized: false, 
    cookie: {
      /* Set the https flag on the session cookie ensuring that it can only be 
      sent over a secure (HTTPS) connection */
      secure: true  
    }
  })
);

// -----------------------------------------------------------------------------
// Now we can set up our authentication details
// -----------------------------------------------------------------------------
const verifier = function (iss, sub, profile, jwtClaims, access_token, 
  refresh_token, params, done) {
  const user = {
    // Extract information from the data returned from B2C/ADFS
    name: jwtClaims.name,
    id: jwtClaims.oid,
    displayName: profile.displayName,

    // Make sure we store the access token
    access_token: params.access_token
  };

/* Tell passport that no error occured (null) and which user object to store 
  with the session. If the credentials are not valid (for example, if the 
  password is incorrect), done should be invoked with false instead of a user 
  to indicate an authentication failure. */
  done(null, user); 
};
// Create and configure the strategy instance that will perform authentication
// The verify call back you provide function(username, password, done) will take 
// care of finding your user and checking if the password matches.
const authenticationStrategy = new OIDCStrategy(authConfig.oidcOptions, verifier);

// Register the strategy with passport
passport.use('azuread-openidconnect', authenticationStrategy);

/* Specify what information about the user should be stored in the session. 
Here we store the entire user object we define in the 'verifier' function.
You can pick only parts of it if you don't need all the information or if you 
have user information stored somewhere else. */
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((passportSession, done) => {
  // placeholder for custom user deserialization.
  // maybe you are getoing to get the user from mongo by id?
  // null is for errors
  done(null, passportSession);
});

// Now that passport is configured we need to tell express to use it
app.use(passport.initialize()); // Register passport with our expressjs instance
/* We are using sessions to persist the login and must therefore also register 
the session middleware from passport. */
app.use(passport.session());  

// Routes are here!
// -----------------------------------------------------------------------------
// Now that all our helper and initialization stuff is ready we can set up the
// routes our app will respond to.
// -----------------------------------------------------------------------------

app.get('/robots.txt', function (req, res) {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});


/* Our home route. Returns index.html and sets the user state if 
the user is logged in (req.user will be undefined of not authenticated). */
app.get('/', (req, res) => {
  // Render the index view (passing it an object with user data)
  // res.render('index', { user: req.user });
  console.log('response from app.get(\'/ssrender\'...) = ', res);
 res.send(res);
});

// This route is wheke we retrieve the authentication information posted
// To perform the necessary steps it needsj to parse post data as well as
// sign in correctly. This is done using the body-parser middleware.
app.post('/', bodyParser.urlencoded({ extended: true }));

// After registering the body-parser middleware for this specific route
// (namely 'POST /'). We can apply our authenticator to read the POSTed
// information. We receive this information and store it on our server for
// use later. Doing so saves us from having to call back to Azure B2C on
// every request in order to verify the user again. TODO: saved
app.post('/', (req, res, next) => {
    // Overview step 3
    helpers.authenticator(res)(req, res, next);
  },
  (req, res) => {
    // Finally we redirect back to the front page, but this time the req.user
    // parameter will be populated because we are signed in.
    res.redirect('/');
  }
);
// At this point we can use the information Azure B2C returned to us to
// perform requests to the Veracity API provided we requested the information
// to begin with. Every time the user performs an action that requires a call
// to the Veracity API we perform this by adding the users access token to
// the request.

// Our login route. This is where the authentication magic happens.
// We must ensure that the policy query parameter is set and we therefore
// include our small middleware before the actual login process.  We redirect
// the user to a specific url on Azure B2C and provide a set of configuration
// options including a request for authentication and an access token to
// access the Veracity API. At this point the user leaves our control and is
// handed over to Azure B2C. Behind the scenes Azure B2C may redirect the
// request to ADFS in order to perform authentication. If the user logs in
// correctly Azure B2C will return them back to us with several pieces of
// information including the user identity.
app.get('/login', helpers.ensureSignInPolicyQueryParameter,
  (req, res, next) => {
    /* Overview step 2.  Add our authenticator middleware helper (passport) 
    to handle the authentication. */
    helpers.authenticator(res)(req, res, next); 
    console.log('response back from Veracity/AD B2C = ', res);
  },
  (req, res) => {
    /* The return-url when login is complete is configured as part of the 
    application registration. */
    res.redirect('/error'); // This redirect will never be used unless something failed. 
  }
);

// Our logout route handles logging out of B2C and removing session information.
app.get('/logout', (req, res, next) => {
  // Overview step 4
  /* First we instruct the session manager (express-session) to destroy the 
  session information for this user. */
  // eslint-disable-next-line
  req.session.destroy(err => {
    /* Then we call the logout function placed on the req object by passport 
    to sign out of Azure B2C */
    req.logout();
    /*  Finally we redirect to Azure B2C to destroy the session information. 
    This will route the user to the /logoutadfs route when done. */
    res.redirect(authConfig.destroySessionUrl);
  });
});
/* This route handles the final step of the logout process. Deleting the 
session cookies set by ADFS in a manner that is not blocked by common browser 
security settings. Note that this will end the users session on a "Signed out" 
page generated by ADFS and will not return them to your application, but it 
is required to finish the logout process. */
app.get('/logoutadfs', (req, res, next) => {
  // Overview step 5
  // Finally redirect the user to the ADFS log out page.
  res.redirect(authConfig.destroyADFSSessionUrl);  
});

// -----------------------------------------------------------------------------
// Set up some example routes to test performing requests to the Veracity API.
// -----------------------------------------------------------------------------
/* This route returns information about the current user by calling the Service 
API endpoint /my/profile. Note that we chain our handlers with 'ensureAuthenticated' 
in order to ensure the user has signed in. If the user has not signed in that 
function will redirect them to the login page automatically. */
app.get('/me', helpers.ensureAuthenticated, (req, res) => {
  // Build the complete url for our request.
  const url = authConfig.veracityApiEndpoint + '/my/profile'; 
  request({
    // Configure and initiate the request.
    url,
    headers: {
      Accept: 'application/json', // Instruct the API that we want JSON data back.
      Authorization: 'Bearer ' + req.user.access_token // Fetch the access token for the user and embed it in the request. Without this we will not be allowed to perform the request.
    }
  })
    .then(result => {
      res.render('me', {
        // Render the result of the call as readable JSON.
        result: JSON.stringify(JSON.parse(result), null, 2) // We do parse->stringify just to make it a bit more readable.
      });
    })
    .catch(error => {
      // In case of error display all information to the user (NOT SECURE!!!)
      res.status(500).render('error', {
        error: JSON.stringify(error, null, 2)
      });
    });
});

// experiment with requiring authentication before main route
app.get('/me', helpers.ensureAuthenticated, (req, res) => {
  console.log(`From app.get('me'... end point, the response was ${res}`);
  const url = authConfig.veracityApiEndpoint + '/my/profile'; // Build the complete url for our request.
  request({
    // Configure and initiate the request.
    url,
    headers: {
      Accept: 'application/json', // Instruct the API that we want JSON data back.
      Authorization: 'Bearer ' + req.user.access_token // Fetch the access token for the user and embed it in the request. Without this we will not be allowed to perform the request.
    }
  })
    .then(result => {
      res.render('me', {
        // Render the result of the call as readable JSON.
        result: JSON.stringify(JSON.parse(result), null, 2) // We do parse->stringify just to make it a bit more readable.
      });
    })
    .catch(error => {
      // In case of error display all information to the user (NOT SECURE!!!)
      res.status(500).render('error', {
        error: JSON.stringify(error, null, 2)
      });
    });
});

// This route returns information about my services
app.get('/services', helpers.ensureAuthenticated, (req, res) => {
  const url = authConfig.veracityApiEndpoint + '/my/services'; // Build the complete url for our request.
  request({
    // Configure and initiate the request.
    url,
    headers: {
      Accept: 'application/json', // Instruct the API that we want JSON data back.
      Authorization: 'Bearer ' + req.user.access_token // Fetch the access token for the user and embed it in the request. Without this we will not be allowed to perform the request.
    }
  })
    .then(result => {
      res.render('me', {
        // Render the result of the call as readable JSON.
        result: JSON.stringify(JSON.parse(result), null, 2) // We do parse->stringify just to make it a bit more readable.
      });
    })
    .catch(error => {
      // In case of error display all information to the user (NOT SECURE!!!)
      res.status(500).render('error', {
        error: JSON.stringify(error, null, 2)
      });
    });
});


app.use('/api', helpers.ensureAuthenticated, api);

app.get('*', (req, res, next) => {
  const err = new Error(`Four OHH four! req.originalUrl = ${req.originalUrl}\n`);
  err.status = 404;
  next(err);
});

// -----------------------------------------------------------------------------
// Finally start our server by calling the start function from server.js
// -----------------------------------------------------------------------------
start();
