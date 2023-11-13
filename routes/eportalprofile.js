var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('eportalprofilelayout', { title: 'Express' });
  Validator(req, res, 'eportalprofilelayout');
});

module.exports = router;