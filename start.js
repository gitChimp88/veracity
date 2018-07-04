//-----------------------------------------------------------------------------
// This file configures the server to support authentication for Veracity APIs
// and requests the access token needed to perform requests.
//-----------------------------------------------------------------------------

// Import our server setup code so that we can configure authentication on our server instance.
const { app, readIndexFileAndSetState, start } = require('./server.js');
// Fetch authentication configuration
const { authConfig } = require('./config.js');

// ExpressSession is used to store session info in memory so the user does not have to re-authenticate on every request.
const expressSession = require('express-session');
// BodyParser is specifically used to parse the POST response from Azure B2C/ADFS.
const bodyParser = require('body-parser');
// PassportJs handles authentication for us using the passport-azure-ad plug-in.
const passport = require('passport');
// Get the strategy we use to authenticate with Azure B2C and ADFS (it handles both for us)
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
// Helper library for performing http requests from node.js. Used to query the Veracity API from the server on behalf of the user.
const request = require('request-promise-native');

const index = require('./routes/index');
//-----------------------------------------------------------------------------
// Set up our session manager that will use in-memory storage for sessions. You should not use in-memory storage in production.
// This must be done before we attach the passport middleware or passport will be unable to use sessions
// For a full description of these options see https://github.com/expressjs/session
//-----------------------------------------------------------------------------
app.use(
  expressSession({
    secret: 'session secret', // The key phrase used to sign session cookies.
    resave: false, // Prevent resaving session data if nothing was modified.
    saveUninitialized: false, // Only save sessions if they are actually initialized (i.e.: only save if the user is actually authenticated)
    cookie: {
      secure: true // Set the https flag on the session cookie ensuring that it can only be sent over a secure (HTTPS) connection
    }
  })
);

//-----------------------------------------------------------------------------
// Now we can set up our authentication details
//-----------------------------------------------------------------------------
const verifier = function(
  iss,
  sub,
  profile,
  jwtClaims,
  access_token,
  refresh_token,
  params,
  done
) {
  const user = {
    // Extract information from the data returned from B2C/ADFS
    name: jwtClaims.name,
    id: jwtClaims.oid,
    displayName: profile.displayName,

    // Make sure we store the access token
    access_token: params.access_token
  };

  done(null, user); // Tell passport that no error occured (null) and which user object to store with the session.
};
// Create and configure the strategy instance that will perform authentication
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
  done(null, passportSession);
});

// Now that passport is configured we need to tell express to use it
app.use(passport.initialize()); // Register passport with our expressjs instance
app.use(passport.session()); // We are using sessions to persist the login and must therefore also register the session middleware from passport.

// Routes are here!
app.use('/api', index);
app.get('*', (req, res, next) => {
  const err = new Error('Four OHH four!');
  err.status = 404;
  next(err);
});

//-----------------------------------------------------------------------------
// Finally start our server by calling the start function from server.js
//-----------------------------------------------------------------------------
start();
