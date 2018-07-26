#! /usr/bin/env node
 

// http://robdodson.me/how-to-run-a-node-script-from-the-command-line/
const to = require('await-to-js').default;
const axios = require('axios');
var async = require("async");

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

let accessToken;
let authStr;
const facilityIdArray = []; 
const inverterParamsArray = [];

const getToken = async () => {
  console.log('creds = ', creds)
  try {
    console.log('creds = ', creds)
    return await axios.post( authURL, creds);

  } catch (error) {
    console.error(error)
  }
};

const getInverters = async () => {
  try {
    // const getTokenPromise = await axios.post( authURL, creds)
    // getTokenPromise.then(successCallback, failureCallback); 
    const getTokenPromise = await getToken();
    // console.log('\n\n\ngetTokenPromise = ', getTokenPromise)
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
    // console.log('facilityIdArray = ', facilityIdArray);
    // console.log(facilityIdArray.length, "facilities with a facility id")
  
    // get inverters for each facility
    const promises = facilityIdArray.map( async facility => {
      const devicesByTypeInverterURL = `http://192.168.32.124:6600/api/horizon/facilities/${facility}/devices/by-type/INVERTER`;
      const response = await axios( devicesByTypeInverterURL, { headers: { Authorization: authStr } } );
      /* Making dynamic key names: 
        return {
        [`invertersForFacility${facility}`]: response.dat // should be array of inverters
      } */
      if (response.data) return response.data // array of inverters
    });
    // response.data && response.data.Parameters && response.data.Parameters.length > 0

  // wait until all promises resolve
    // array of arrays. each child array is a list of inverters for a facility  
    const invertersArrayNotFlat = await Promise.all(promises)
    // console.log('inverters in each plant? = \n ', JSON.stringify(invertersArrayNotFlat, null, 2));
    // console.log('inverters for each plant = \n ', invertersArrayNotFlat);
    
    // flatten array
    let invertersArrayAndZeros = [].concat.apply([],invertersArrayNotFlat);
    // console.log('invertersArrayAndZeros = ', invertersArrayAndZeros);

    // for each inverter (object) in Array: return Parameters.Key  (which has
    // DeviceId and Parameter) now we have one array of objects we could reduce
    // like this:
    // https://stackoverflow.com/questions/34398279/map-and-filter-an-array-at-the-same-time-in-javascript
    //
/*     const parAndDevIds = invertersArray.reduce( facility => {
      if ( facility.Parameters[0] !== undefined ) { 
        let dataToKeep =  {
          FacilityId: facility.FacilityId,
          DeviceId: facility.Parameters[0].Key.DeviceId,
          ParameterId: facility.Parameters[0].Key.ParameterId,
        } 

      } 
    },[]); */

    // console.log('parAndDevIds = ',
    // JSON.stringify(parAndDevIds, null, 2));
    // console.log('parAndDevIds = ', parAndDevIds);
    // console.log('invertersArrayFlat = ,', invertersArray)

  /* map over array of facilities and for each facility: 
      const newFacility = {}
      map over all parameters in facility.Parameters array, doing: 
        save each property to a key in newObject      

  */
    // filter out facilitites that don't have inverters in them
    const invertersArrayFiltered = invertersArrayAndZeros.filter( inverter =>  {
      // console.log( 'inverter.Parameters.length = ', inverter.Parameters.length);
      return inverter.Parameters.length > 0
    });
    // console.log('invertersArrayFiltered = ', invertersArrayFiltered)

    const invertersArray = [];
    invertersArrayFiltered.forEach( inverter => { 
      inverter.Parameters.forEach( param => {
        let newInverterDataObject = {}; 
        newInverterDataObject.FacilityId = inverter.FacilityId;
        newInverterDataObject.Id = inverter.Id;
        newInverterDataObject.DeviceId =  param.Key.DeviceId;
        newInverterDataObject.ParameterId =  param.Key.ParameterId;
        newInverterDataObject.Name =  param.Name;
        newInverterDataObject.ParameterSubType =  param.ParameterSubType;
        newInverterDataObject.ParameterType =  param.Insolation;
        newInverterDataObject.Units =  param.Units;
        
        invertersArray.push(newInverterDataObject);
      });

      // console.log('newInverterDataObject = ', JSON.stringify( newInverterDataObject , null, 2));

    });

    callForVariables(invertersArray)

    //  await Promise.all(inverterPromises)
    //   .then((values) => {
    //     console.log('all loaded YO', values)
    //     return values;
    //   }, function() {
    //     console.log('stuff failed')
    //   }); 

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
        console.log('Error. Request made but no response received....', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error in setting up request....', error.message);
      }
      console.log('error.config = \n', error.config);
    console.error('\n\n\n console.error = \n',error)
  }
}

// takes array of promises and returns array of variables
 function callForVariables(arr) {
  console.log( 'Array of promises input to callForVariables = ', arr);
  const variableIdURL = 'http://192.168.32.124:6600/api/horizon/parametertovariable/deviceparameter';
  let requestData = {};
  const variableIdPromises = arr.map( async inverter => {
    try { 
      console.log('\n\n\n\n\n');
      console.log('inverter = ', JSON.stringify( inverter , null, 2));
        requestData = {
        'DeviceId':  inverter.DeviceId,
        'ParameterId':  inverter.ParameterId
      }

      let requestObj = {
        url: variableIdURL,  
        data: requestData,
        auth: { headers: { Authorization: authStr } },
        withCredentials: true
      }

      console.log('object passed to axios = ', JSON.stringify( requestObj, null, 2 ))
      console.log('requestData = ', JSON.stringify(requestData, null, 2)); 
      const variableIdResponse = await axios(requestObj);
      console.log('variableIdResponse.data = ', variableIdResponse.data)
/*       // add returned variable to object, then return
      let retObj = inverter;
      retObj.variableName = variableIdResponse.data;
      if (variableIdResponse.data) return retObj;
       */
      if (variableIdResponse.data) return variableIdResponse.data;
      
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
  });
  
  
 return Promise.all(variableIdPromises)
      .then((values) => {
        console.log('all loaded YO', values)
        return values;
      }, function() {
        console.log('stuff failed')
      }); 

  }
  
  /* getInverters().then((values) => {
    console.log('all loaded YO', values)
    return values;
  }, function() {
    console.log('stuff failed')
  });  */
  
  // utility funcitons
    
  
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
  } */
  
 
 getInverters();