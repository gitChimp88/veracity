// Fetch authentication configuration
const { authConfig } = require('./config.js');
// PassportJs handles authentication for us using the passport-azure-ad plug-in.
const passport = require('passport');



// Finally we create some helper functions to simplify routing.
// Helper that will perform the authentication against B2C/ADFS.
exports.authenticator = res => {
  console.log( 'authenticator ran!! res = ', res);
  // Construct middleware that can perform authentication
  return passport.authenticate('azuread-openidconnect', {
    response: res,
    failureRedirect: '/error', // Where to route the user if the authentication fails
    failureFlash: true  
  });
};
// Helper middleware that will verify that the user is authenticated and if not
// perform authentication. Its the same as: req.session.passport.user !== undefined
exports.ensureAuthenticated = (req, res, next) => {
  console.log( 'ensureAuthenticated ran!! req = ', req, 'res = ', res)
  console.log('req.isAuthenticated() = ', req.isAuthenticated());
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
exports.ensureSignInPolicyQueryParameter = (req, res, next) => {
  req.query.p = req.query.p || authConfig.policyName;
  next();
};




