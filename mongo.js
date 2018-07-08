const mongoose = require('mongoose');
const { databaseConfig } = require('./config.js');

const cosmosConnectStringHardCoded =
  'mongodb://azurecosmosdbaccountevan:sA4vaugVTvQbTCCvscsACwRmVTd0ReW6d4b8BaCTb61sOmadCsjDa4UcUaRATeEl2tWOYuXfHZJ7qkWvBXCOaQ==@azurecosmosdbaccountevan.documents.azure.com:10255/?ssl=true&replicaSet=globaldb';
mongoose.Promise = global.Promise;
// mongoose.set(‘debug’, true);
// Const mongoUri = `mongodb://${env.dbName}.documents.azure.com:${env.cosmosPort}/?ssl=true`;

/* function connect() {
  return mongoose.connect(mongoUri, { auth: { user: env.dbName, pass: env.key }});
} */

function connect () {
  return mongoose.connect(databaseConfig.cosmosConnectString);
}

const db = mongoose.connection;
db.on('error', console.error.bind(console, '# Mongo DB: connection error:'));
// db.once('open', function (callback) { 
//   console.log('# Mongo DB: Connected to server');
// });

module.exports = {
  connect,
  mongoose
};
