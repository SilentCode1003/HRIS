var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('eportalpaysliplayout', { title: 'Express' });
  Validator(req, res, 'eportalpaysliplayout');
});

module.exports = router;