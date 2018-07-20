// ingest data
const rp = require('request-promise');

const urlEX = { method: 'http://jsonplaceholder.typicode.com/' };
const url1 = {}; // /api/horizon/facilities
const url2 = {};  //  /api/horizon/facilities/2/devices/by-type/INVERTER
const url3 = {};   //  /api/horizon/parametertovariable/facilityparameter

async function doRequests() {
  let response;

  response = await rp(urlEX);
  console.log('dogs: ', response) 
  response = await rp(url1);
  // add stuff from url1 response to url2
  // get token

  response = await rp(url2);
  // add stuff from url2 response to url3
  // get all plant ids 
  response = await rp(url3);
  // do stuff after all requests
  // get 

  // If something went wrong
  // throw new Error('messed up')
}

doRequests()
.catch(err => console.log); // Don't forget to catch errors
