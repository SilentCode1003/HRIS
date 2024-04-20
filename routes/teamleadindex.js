const mysql = require("./repository/hrmisdb");
//const moment = require('moment');
var express = require("express");
const { ValidatorForTeamLead } = require("./controller/middleware");
var router = express.Router();
//const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  ValidatorForTeamLead(req, res, "teamleadindexlayout");
});

module.exports = router;
