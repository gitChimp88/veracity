#! /usr/bin/env node

// http://robdodson.me/how-to-run-a-node-script-from-the-command-line/
const axios = require('axios');
require('dotenv').config({path:'/Users/evanhendrix1/programming/code/green-power-monitor/experiment-instatrust/veracity-app/ingestion-sandbox/.env'});

console.log('you. are. AWESOME!');  
const queryString = require('query-string');

// ingest data with axios 
const authURL = 'http://192.168.32.124:6600/api/Account/Token?api_key=horizon';
const facilitiesURL = 'http://192.168.32.124:6600/api/horizon/facilities';

const creds = { 'username': process.env.GPM_USERNAME, 'password': process.env.GPM_PASSWORD }

let accessToken;
let authStr;
const facilityIdArray = []; 
const inverterParamsByFacilityArray = [];

const getToken = async () => {
  try {
    // console.log('creds = ', creds)
    return await axios.post( authURL, creds);
  } catch (error) {
    console.error(error)
  }
}

const getInvertersByFacility = async () => {
  try {
  const response = await getToken();
  // console.log('\n\n\nresponse = ', response)
  // console.log('response.data.AccessToken ' + response.data.AccessToken);
  accessToken = response.data.AccessToken;
  // console.log('accessToken = ', accessToken);
  authStr = 'Bearer '.concat(accessToken);
  // console.log('authStr = ', authStr)
  const facilityIdsResponse = await axios( facilitiesURL, { headers: { Authorization: authStr } });
  
  if (facilityIdsResponse.data) {
    console.log(`Got ${Object.entries(facilityIdsResponse.data).length} facilities`)
  }
  facilityIdsResponse.data.forEach( facility => {
    const facilityIdLocal = (facility.Parameters[0]) ? 
    facilityIdArray.push(facility.Parameters[0].Key.FacilityId) : null;
    return facilityIdLocal;
  });
  console.log('facilityIdArray = ', facilityIdArray);
  console.log(facilityIdArray.length, "facilities with a facility id")
  
  const promises = facilityIdArray.map( async facility => {
    const devicesByTypeInverterURL = `http://192.168.32.124:6600/api/horizon/facilities/${facility}/devices/by-type/INVERTER`;
    const response = await axios( devicesByTypeInverterURL, { headers: { Authorization: authStr } } );
    return {
      [`invertersForFacility${facility}`]: response.data // should be array of inverters
    }
  });

  // wait until all promises resolve
  const invertersByFacilityArray = await Promise.all(promises)
  // console.log('inverters in each plant? = \n ', JSON.stringify(invertersByFacilityArray, null, 2));
  console.log('inverters in each plant? = \n ', invertersByFacilityArray);

  } catch (error) {
    console.error(error)
  }
}


// getInvertersByFacility();
getInvertersByFacility()






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