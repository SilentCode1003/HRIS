const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('registerlayout', { title: 'Express' });
//   Validator(req, res, 'registerlayout');
});

module.exports = router;