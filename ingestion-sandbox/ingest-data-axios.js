

// middleware.js


const authURL = 'http://192.168.32.124:6600/api/Account/Token?api_key=horizon';

export function authenticate(req, res, next) {
  const creds = { 
    'username': 'H_Epp2', 'password': '8kDVRc5W00' };

  axios.post(authURL, creds)
    .then(response => response.data)
    .then(auth => {
      // this is the part where you preconfigure authoken
      // based on your auth service response
      req.axios = axios.create({
        headers: {Authtoken: auth.token}
      });
      next(); // <- handing over to the next middleware
    })
    .catch(error => {
      res.status(401).json({error: 'authentication failed'});
    });
}