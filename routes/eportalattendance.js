var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('eportalattendancelayout', { title: 'Express' });
  Validator(req, res, 'eportalattendancelayout');
});

module.exports = router;