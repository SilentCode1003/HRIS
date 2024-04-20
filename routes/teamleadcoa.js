const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { ValidatorForTeamLead } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();


/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  ValidatorForTeamLead(req, res, 'teamleadcoalayout');
});

module.exports = router;