var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('eportalsalarylayout', { title: 'Express' });
  Validator(req, res, 'eportalsalarylayout');
});

module.exports = router;