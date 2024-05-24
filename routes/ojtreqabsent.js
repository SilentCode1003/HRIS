const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { ValidatorforOjt } = require("./controller/middleware");
const { Encrypter } = require("./repository/crytography");
var router = express.Router();
const currentDate = moment();

const currentYear = moment().format("YYYY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  ValidatorforOjt(req, res, "ojtreqabsentlayout", "ojtreqabsent");
});

module.exports = router;
