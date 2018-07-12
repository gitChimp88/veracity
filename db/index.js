const mongoose = require('mongoose');
const { databaseConfig } = require('../config');

const cosmosConnectStringHardCoded =
  'mongodb://azurecosmosdbaccountevan:sA4vaugVTvQbTCCvscsACwRmVTd0ReW6d4b8BaCTb61sOmadCsjDa4UcUaRATeEl2tWOYuXfHZJ7qkWvBXCOaQ==@azurecosmosdbaccountevan.documents.azure.com:10255/?ssl=true&replicaSet=globaldb';

const dbURL = databaseConfig.cosmosConnectString;

mongoose.Promise = global.Promise;
// mongoose.set(‘debug’, true);
// Const mongoUri = `mongodb://${env.dbName}.documents.azure.com:${env.cosmosPort}/?ssl=true`;

/* function connect() {
  return mongoose.connect(mongoUri, { auth: { user: env.dbName, pass: env.key }});
} */

function connect () {
  return mongoose.connect(dbURL);
}

const db = mongoose.connection;
db.on('error', function (err) {
  console.error('There was a db connection error');
  return  console.error(err.message);
});
db.once('connected', function () {
  return console.log('Successfully connected to ' + dbURL);
});
db.once('disconnected', function () {
  return console.error('Successfully disconnected from ' + dbURL);
});
module.exports = {
  connect,
  mongoose
};
