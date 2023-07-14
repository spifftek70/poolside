var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Desert Poolside'});
});

/* GET Grill page. */
router.get('/grill', function(req, res, next) {
  res.render('grill', { title: 'Grilling Out'});
});

/* GET Cooling page. */
router.get('/cooling', function(req, res, next) {
  res.render('cooling', { title: 'Keeping Cool'});
});

/* GET Pool&Spa page. */
router.get('/poolspa', function(req, res, next) {
  res.render('poolspa', { title: 'The Pool & Spa'});
});

/* GET Media page. */
router.get('/media', function(req, res, next) {
  res.render('media', { title: 'Audio / Video'});
});

module.exports = router;
