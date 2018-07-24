const queryString = require('query-string');

const authURL = 'http://192.168.32.124:6600/api/Account/Token?api_key=horizon';

export function authenticate(req, res, next) {
  const creds = { 
    'username': process.env.GPM_USERNAME, 'password': process.env.GPM_PASSWORD };

  axios.post(authURL, creds)
    .then(response => response.data)
    .then(auth => {
      // this is the part where you preconfigure authoken
      // based on your auth service response
      req.axios = axios.create({
        headers: {Bearer auth.token}
      });
      next(); // <- handing over to the next middleware
    })
    .catch(error => {
      res.status(401).json({error: 'authentication failed'});
    });
}

// Example

const creds = {
}

axios.post(authURL, queryString.stringify(creds))
  .then(response => {
    console.log(response.data);
    USER_TOKEN = response.data.AccessToken;
    console.log('userresponse ' + response.data.AccessToken);
  })
  .catch((error) => {j
    console.log('error ' + error);
  });
  
const AuthStr = 'Bearer '.concat(USER_TOKEN);
axios.get(facilitiesURL, { headers: { Authorization: AuthStr } })
.then(response => {
        // If request is good...
        console.log(response.data);
      })
      .catch((error) => {
        console.log('error 3 ' + error);
      });