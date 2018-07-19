#! /usr/bin/env node

// http://robdodson.me/how-to-run-a-node-script-from-the-command-line/

console.log('you. are. AWESOME!');  

// ingest data with axios 
const axios = require('axios');

const getBreeds = async () => {
  try {
    return await axios.get('https://dog.ceo/api/breeds/list/all');
  } catch (error) {
    console.error(error)
  }
}

const countBreeds = async () => {
  const breeds = await getBreeds()

  if (breeds.data.message) {
    console.log(`Got ${Object.entries(breeds.data.message).length} breeds`)
  }
}

countBreeds();