const mysql = require("./repository/hrmisdb");
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('eportalindexlayout', { title: 'Express' });
  Validator(req, res, 'eportalindexlayout');
});

module.exports = router;
