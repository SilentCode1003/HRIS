const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('employeeprofilelayout', { title: 'Express' });

  Validator(req, res, 'empbackgroundlayout');
});

module.exports = router;