const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();
const XLSX = require("xlsx", "xlsx-style");
const { Select } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "enrolled_bank_acclayout", "enrolled_bank_acc");
});

module.exports = router;



