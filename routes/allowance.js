var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  SelectStatement,
  GetCurrentYear,
  GenerateDates,
  InsertStatement,
  UpdateStatement,
  GetCurrentDatetime,
  SelectAllStatement,
} = require("./repository/customhelper");
const { Select, Insert, Update } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { GetValue, PND } = require("./repository/dictionary");
const { REQUEST_STATUS, REQUEST } = require("./repository/enums");
const { SendEmailNotification } = require("./repository/emailsender");
const {
  MessageStatus,
  JsonErrorResponse,
  JsonDataResponse,
} = require("./repository/response");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportaldtrlayout', { title: 'Express' });
  Validator(req, res, "allowancelayout", "allowance");
});

module.exports = router;

router.get("/get-daily-allowance", (req, res) => {
  try {
    let select_sql = SelectAllStatement(
      Payroll.daily_allowance.tablename,
      Payroll.daily_allowance.selectColumns
    );

    console.log(select_sql);
    

    Select(select_sql, (err, result) => {
      if (err) {
        res.status(500).json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, Payroll.daily_allowance.prefix);

        res.status(200).json(JsonDataResponse(data));
      } else {
        res.status(200).json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});
router.get("/get-fix-allowance", async (req, res) => {
  try {
    let select_sql = SelectAllStatement(
      Payroll.fix_allowance.tablename,
      Payroll.fix_allowance.selectColumns
    );

    Select(select_sql, (err, result) => {
      if (err) {
        res.status(500).json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, Payroll.fix_allowance.prefix);

        res.status(200).json(JsonDataResponse(data));
      } else {
        res.status(200).json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});
