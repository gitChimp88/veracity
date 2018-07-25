#! /usr/bin/env node
 

// http://robdodson.me/how-to-run-a-node-script-from-the-command-line/
const to = require('await-to-js').default;
const axios = require('axios');
/* axios.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  return Promise.reject(error);
}); */
require('dotenv').config({path:'/Users/evanhendrix1/programming/code/green-power-monitor/experiment-instatrust/veracity-app/services/.env'});

console.log('you. are. AWESOME!');  
const queryString = require('query-string');

// ingest data with axios 
const authURL = 'http://192.168.32.124:6600/api/Account/Token?api_key=horizon';
const facilitiesURL = 'http://192.168.32.124:6600/api/horizon/facilities';

const creds = { 'username': process.env.GPM_USERNAME, 'password': process.env.GPM_PASSWORD }

const variableIdsByFacility = Promise.all([]) ;
let accessToken;
let authStr;
const facilityIdArray = []; 
const inverterParamsByFacilityArray = [];

const getToken = async () => {
  console.log('creds = ', creds)
  try {
    console.log('creds = ', creds)
    return await axios.post( authURL, creds);

  } catch (error) {
    console.error(error)
  }
};

const getInvertersByFacility = async () => {
  try {
    // const getTokenPromise = await axios.post( authURL, creds)
    // getTokenPromise.then(successCallback, failureCallback); 
    const getTokenPromise = await getToken();
    console.log('\n\n\ngetTokenPromise = ', getTokenPromise)
    console.log('getTokenPromise.data.AccessToken = ', getTokenPromise.data.AccessToken);
    accessToken = await getTokenPromise.data.AccessToken;
    // console.log('accessToken = ', accessToken);
    authStr = 'Bearer '.concat(await accessToken);
    // console.log('authStr = ', authStr)
    const facilityIdsResponse = await axios( facilitiesURL, { headers: { Authorization: authStr } });
    
    // make array of facility ids
    facilityIdsResponse.data.forEach( facility => {
      if (facility && facility.Parameters[0]) {
      facilityIdArray.push(facility.Parameters[0].Key.FacilityId) ;
    }});
    console.log('facilityIdArray = ', facilityIdArray);
    // console.log(facilityIdArray.length, "facilities with a facility id")
  
    // get inverters for each facility
    const promises = facilityIdArray.map( async facility => {
      const devicesByTypeInverterURL = `http://192.168.32.124:6600/api/horizon/facilities/${facility}/devices/by-type/INVERTER`;
      const response = await axios( devicesByTypeInverterURL, { headers: { Authorization: authStr } } );
      /* Making dynamic key names: 
        return {
        [`invertersForFacility${facility}`]: response.data // should be array of inverters
      } */
      if (response.data) return response.data // array of inverters
    });
    // response.data && response.data.Parameters && response.data.Parameters.length > 0

    // wait until all promises resolve
    // array of arrays. each child array is a list of inverters for a facility  
    const invertersByFacilityArrayNotFlat = await Promise.all(promises)
    // console.log('inverters in each plant? = \n ', JSON.stringify(invertersByFacilityArrayNotFlat, null, 2));
    console.log('inverters for each plant = \n ', invertersByFacilityArrayNotFlat);
    
    // flatten array
    let invertersByFacilityArrayAndZeros = [].concat.apply([],invertersByFacilityArrayNotFlat);
    console.log('invertersByFacilityArrayAndZeros = ', invertersByFacilityArrayAndZeros);

    // for each inverter (object) in Array: return Parameters.Key  (which has
    // DeviceId and Parameter) now we have one array of objects we could reduce
    // like this:
    // https://stackoverflow.com/questions/34398279/map-and-filter-an-array-at-the-same-time-in-javascript
    //
/*     const parAndDevIdsByFacility = invertersByFacilityArray.reduce( facility => {
      if ( facility.Parameters[0] !== undefined ) { 
        let dataToKeep =  {
          FacilityId: facility.FacilityId,
          DeviceId: facility.Parameters[0].Key.DeviceId,
          ParameterId: facility.Parameters[0].Key.ParameterId,
        } 

      } 
    },[]); */

    // console.log('parAndDevIdsByFacility = ',
    // JSON.stringify(parAndDevIdsByFacility, null, 2));
    // console.log('parAndDevIdsByFacility = ', parAndDevIdsByFacility);
    // console.log('invertersByFacilityArrayFlat = ,', invertersByFacilityArray)

  /* map over array of facilities and for each facility: 
      const newFacility = {}
      map over all parameters in facility.Parameters array, doing: 
        save each property to a key in newObject      

  */
    const invertersByFacilityArray = invertersByFacilityArrayAndZeros.filter( inverter =>  {
      console.log(inverter.Parameters.length)
      return inverter.Parameters.length > 0
    });
    console.log('invertersByFacilityArray = ', invertersByFacilityArray)


    const variableIdsByFacilityPromises = invertersByFacilityArray.reduce( async (filtered, inverter) => {
      const variableIdsByFacilityUrl = 'http://192.168.32.124:6600/api/horizon/parametertovariable/deviceparameter';
      // console.log('inverter = ', inverter)
      if ( inverter.Parameters.length > 0 ) { 
       let inverterRequestData = inverter.Parameters.map( param => {
          console.log('param = ', JSON.stringifty(param, null, 2));
          return {
          // requestData.[`evanblah'${blah}'`] = blah;
            'FacilityId': param.FacilityId,
            'DeviceId': param.Key.DeviceId,
            'ParameterId': param.Key.ParameterId,
            'Name': param.Name,
            'ParameterSubType': param.ParameterSubType,
            'ParameterType': param.Insolation,
            'Units': param.Units
          };
        });
        return newInverterDataObject;
       // requestData 
       console.log('filtered = ', filtered);
        console.log('inverterRequestData = ', inverterRequestData);
       const variableIdsByFacilityResponse = await axios({
         method: 'post',
         url: variableIdsByFacilityUrl,  
         data: inverterRequestData,
         auth: { headers: { Authorization: authStr } }
        });
        filtered.push(variableIdsByFacilityResponse.Data);
      }
    },[]);



    console.error('what is here?', error) // EXPERIMENT
    let variableIdsByFacility = await Promise.all(variableIdsByFacilityPromises);
    console.log('variableIdsByFacility = ', variableIdsByFacility  )
  } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('\nError, request made, but server responded with ...', error.response.data);
        console.log('\nError.response.status = ', error.response.status);
        console.log('\nError.response.headers = ', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received `error.request` is
        // an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log('Error. Request made but no response recieved....', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error in setting up request....', error.message);
      }
      console.log('error.config = \n', error.config);
    console.error('\n\n\n console.error = \n',error)
  }
}


// getInvertersByFacility();
getInvertersByFacility()

// utility funcitons

/* 
function flatten(items) {
//  console.log('argument to flatten = ', items) 
  const flat = [];

  items.forEach(item => {
    if (Array.isArray(item)) {
      flat.push(...flatten(item));
    }
    if (isAnObject) {
      // parse over that?
    }  
    else {
      flat.push(item);
    }
  });

  return flat;
} */

function some( promises, count = 1 ){

  const wrapped = promises.map( promise => promise.then(value => ({ success: true, value }), () => ({ success: false })) );
  return Promise.all( wrapped ).then(function(results){
     const successful = results.filter(result => result.success);
     if( successful.length < count )
        throw new Error("Only " + successful.length + " resolved.")
     return successful.map(result => result.value);
  });

}


      /* { 
        userId: '1',
        title: 'examplestring',
        completed: false
       }, */

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