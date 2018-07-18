const express = require('express');
const router = express.Router();

// Fetch authentication configuration
const { authConfig } = require('../config');
// BodyParser is specifically used to parse the POST response from Azure B2C/ADFS.
const bodyParser = require('body-parser');
// PassportJs handles authentication for us using the passport-azure-ad plug-in.
const passport = require('passport');
// Helper library for performing http requests from node.js. Used to query the Veracity API from the server on behalf of the user.
const request = require('request-promise-native');

const heroesService = require('../controllers/hero-service');


// -----------------------------------------------------
// From react-cosmosdb
router.get('/heroes', (req, res) => {
  heroesService.get(req, res);
});

router.put('/hero', (req, res) => {
  heroesService.create(req, res);
});

router.post('/hero', (req, res) => {
  heroesService.update(req, res);
});

router.delete('/hero/:id', (req, res) => {
  heroesService.destroy(req, res);
});

router.get('/ping', function (req, res){
  res.status(200).send('pong!');
});

module.exports = router;