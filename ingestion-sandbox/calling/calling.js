#! /usr/bin/env node

// http://robdodson.me/how-to-run-a-node-script-from-the-command-line/
const axios = require('axios');
require('dotenv').config();

console.log('you. are. AWESOME!');  
const queryString = require('query-string');

// ingest data with axios 
const authURL = 'http://192.168.32.124:6600/api/Account/Token?api_key=horizon';

const facilitiesURL = 'http://192.168.32.124:6600/api/horizon/facilities'
// TODO: put these in env variables
const creds = { 'username': process.env.GPM_USERNAME, 'password': process.env.GPM_PASSWORD }
let USER_TOKEN;
let authStr;

const getToken = async () => {
  try {
    return await axios.post( authURL, creds);
  } catch (error) {
    console.error(error)
  }
}

const getFacilities = async () => {
  const response = await getToken();
  console.log('\n\n\nresponse = ', response)
  console.log('response.data.AccessToken ' + response.data.AccessToken);
    USER_TOKEN = response.data.AccessToken;
  console.log('USER_TOKEN = ', USER_TOKEN);
    authStr = 'Bearer '.concat(USER_TOKEN);
    console.log('authStr = ', authStr)
  try {
    return await axios.get( facilitiesURL, { headers: { Authorization: authStr } });
  } catch (error) {
    console.error(error)
  }
}

const countFacilities = async () => {
  const response = await getFacilities();
  console.log('response.data = ', JSON.stringify(response.data, null, 2));
  console.log('response.data = ', response.data );
  if (response.data.message) {
    console.log(`Got ${Object.entries(response.data.message).length} facilities`)
  }
}

// getFacilities();
countFacilities()

/* 
 axios.post(authURL, queryString.stringify(creds))
  .then(response => {
    console.log(response.data);
    USER_TOKEN = response.data.AccessToken;
    const authStr = 'Bearer '.concat(USER_TOKEN);
    console.log('userresponse ' + response.data.AccessToken);
  })
  .catch((error) => {
    console.log('error ' + error);
  });
  
axios.get(facilitiesURL, { headers: { Authorization: authStr } })
.then(response => {
        // If request is good...
        console.log(response.data);
      })
      .catch((error) => {
        console.log('error 3 ' + error);
      }); */