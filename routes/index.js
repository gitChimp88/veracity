const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();

const heroesService = require('../controllers/hero-service');

// Finally we create some helper functions to simplify routing.
// Helper that will perform the authentication against B2C/ADFS.
const authenticator = res => {
  // Construct middleware that can perform authentication
  return passport.authenticate('azuread-openidconnect', {
    response: res,
    failureRedirect: '/error' // Where to route the user if the authentication fails
  });
};
// Helper middleware that will verify that the user is authenticated and if not
// perform authentication. Its the same as: req.session.passport.user !== undefined
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    // User is authenticated, simply pass control to the next route handler.
    return next();
  }
  // User is not authenticated, redirect to our /login route that will perform
  // authentication (see below).
  res.redirect('/login');
};
// TODO: Make route for create username (redirect them to veractity?)
/* This is a small helper that ensures the policy query parameter is set.
TODO: WHat does this mean? 'links on the client that specify the policy query 
parameter?' If you have links on the client that specify the p=[policy] query 
paramter this is not needed. We do this since we know which policy to use in 
all cases and wish to avoid hard coding this into links for the client. */
const ensureSignInPolicyQueryParameter = (req, res, next) => {
  req.query.p = req.query.p || authConfig.policyName;
  next();
};

//-----------------------------------------------------------------------------
// Now that all our helper and initialization stuff is ready we can set up the
// routes our app will respond to.
//-----------------------------------------------------------------------------
// Our home route. Returns index.html and sets the user state if the user
// is logged in (req.user will be undefined of not authenticated).
router.get('/', (req, res) => {
  // Render the index view (passing it an object with user data)
  res.render('index', { user: req.user });
});

// This route is where we retrieve the authentication information posted
// back from Azure B2C/ADFS.
// To perform the necessary steps it needs to parse post data as well as
// sign in correctly. This is done using the body-parser middleware.
router.post('/', bodyParser.urlencoded({ extended: true }));
// After registering the body-parser middleware for this specific route
// (namely 'POST /'). We can apply our authenticator to read the POSTed
// information. We receive this information and store it on our server for
// use later. Doing so saves us from having to call back to Azure B2C on
// every request in order to verify the user again. TODO: saved
router.post(
  '/',
  (req, res, next) => {
    // Overview step 3
    authenticator(res)(req, res, next);
  },
  (req, res) => {
    // Finally we redirect back to the front page, but this time the req.user
    // parameter will be populated eecause we are signed in.
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
router.get(
  '/login',
  ensureSignInPolicyQueryParameter,
  (req, res, next) => {
    // Overview step 2
    authenticator(res)(req, res, next); // Add our authenticator middleware helper (passport) to handle the authentication.
    console.log(`response back from Veracity/AD B2C = `, res);
  },
  (req, res) => {
    res.redirect('/error'); // This redirect will never be used unless something failed. The return-url when login is complete is configured as part of the application registration.
  }
);

// Our logout route handles logging out of B2C and removing session information.
router.get('/logout', (req, res, next) => {
  // Overview step 3
  // First we instruct the session manager (express-session) to destroy the session information for this user.
  req.session.destroy(err => {
    // Then we call the logout function placed on the req object by passport to sign out of Azure B2C
    req.logout();
    // Finally we redirect to Azure B2C to destroy the session information. This will route the user to the /logoutadfs route when done.
    res.redirect(authConfig.destroySessionUrl);
  });
});
// This route handles the final step of the logout process. Deleting the session cookies set by ADFS in a manner that is not blocked by common browser security settings.
// Note that this will end the users session on a "Signed out" page generated by ADFS and will not return them to your application, but it is required to finish the logout process.
router.get('/logoutadfs', (req, res, next) => {
  // Overview step 5
  res.redirect(authConfig.destroyADFSSessionUrl); // Finally redirect the user to the ADFS log out page.
});

//-----------------------------------------------------------------------------
// Set up some example routes to test performing requests to the Veracity API.
//-----------------------------------------------------------------------------
// This route returns information about the current user by calling the Service API endpoint /my/profile
// Note that we chain our handlers with 'ensureAuthenticated' in order to ensure the user has signed in.
// If the user has not signed in that function will redirect them to the login page automatically.
router.get('/me', ensureAuthenticated, (req, res) => {
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
router.get('/services', ensureAuthenticated, (req, res) => {
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

// -----------------------------------------------------
// From react-cosmosdb
router.get('/heroes', (req, res) => {
  heroesService.get(req, res);
});

router.put('/hero', (req, res) => {
  heroesService.create(req, res);
});

router.post('/hero', (req, res) => {
  heroesService.update(req, res);
});

router.delete('/hero/:id', (req, res) => {
  heroesService.destroy(req, res);
});

module.exports = router;
