const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Master_Geofence_Settings } = require("./model/hrmisdb");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('govermentidlayout', { title: 'Express' });
  Validator(req, res, "paysliplayout", "payslip");
});

module.exports = router;
