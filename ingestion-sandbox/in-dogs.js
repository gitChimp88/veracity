// ingest data with axios 
const axios = require('axios');

const getBreeds = async () => {
  try {
    return await axios.get('https://dog.ceo/api/breeds/list/all');
  } catch (error) {
    console.error(error)
  }
}

module.exports.countBreeds = async () => {
  const breeds = await getBreeds()

  if (breeds.data.message) {
    console.log(`Got ${Object.entries(breeds.data.message).length} breeds`)
  }
}

// countBreeds()
// can call from command line like this: 
// $ node -e 'require("./in-dogs.js").countBreeds()'
