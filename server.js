// -----------------------------------------------------------------------------
// This file sets up our server and expressjs instance.
// It does not contain code specific to the authentication and api calls. See start.js
// -----------------------------------------------------------------------------

const fs = require('fs'); // Used to read the index.html file from disk.
const path = require('path'); // Used to resolve paths properly.

const https = require('https'); // Used to configure the HTTPS server.
const express = require('express'); // We use ExpressJS to control our HTTPS server.
const morgan = require('morgan'); // Used to log all request to output.
const cheerio = require('cheerio'); // Used to parse the index.html file and write state JSON to it.

const { serverConfig } = require('./config.js'); // Load only server config from our config file.


// Resolve absolute paths to the files we need.
const keyFullPath = path.resolve(__dirname, serverConfig.keyFile);
const certFullPath = path.resolve(__dirname, serverConfig.certFile);

// Do a quick health check to see that the files are present.
if (!fs.existsSync(keyFullPath)) throw new Error(`Unable to resolve private key file. Use 'npm run gencert' to generate this file (requires openssl). Expected location "${keyFullPath}"`);
if (!fs.existsSync(certFullPath)) throw new Error(`Unable to resolve certificate file. Use 'npm run gencert' to generate this file (requires openssl). Expected location "${certFullPath}"`);

const app = express(); // Initialize an expressjs application instance.
// TODO: add productiion scale session store (Azure Tables?)
app.set('trust proxy', 1); // trust first proxy
const server = https.createServer({
  // Pass our private key and certificate to the server.
  key: fs.readFileSync(keyFullPath),
  cert: fs.readFileSync(certFullPath)
}, app); // Initialize an HTTPS server and set our app instance as the callback function for requests.

// We'll be using ejs as our template engine. Configure expressjs to use it.
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs');

// Connect the morgan middleware to express so it can log requests.
app.use(morgan('dev'));


// Create this handy function that we can call to start up our server once we have configured the stuff we need in start.js
const start = () => {
  // Instruct our server to start listening for requests.
  server.listen(serverConfig.port, () => {
    console.log(`HTTPS server ready and listening for connections @ https://localhost:${serverConfig.port}`);
  }).on('error', error => { // Add an error handler to log common errors
    switch (error.code){
      case 'EACCES':
        console.error(`Unable to bind to port ${serverConfig.port}. Insufficient priveliges.`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`Unable to bind to port ${serverConfig.port}. It's already in use.`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  });
};


// Export both the app instance and the HTTPS server for use in other modules.
module.exports = {
  app, server, start
};