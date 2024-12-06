const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, InsertTable } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const {
  InsertStatement,
  SelectStatement,
} = require("./repository/customhelper");
const { SendEmailNotificationEmployee } = require("./repository/emailsender");
var router = express.Router();
const currentDate = moment();

const { REQUEST } = require("./repository/enums");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(req, res, "teamleadapprovedotmeallayout", "teamleadapprovedotmeal");
});

module.exports = router;