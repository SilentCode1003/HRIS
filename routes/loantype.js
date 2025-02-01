var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  SelectStatement,
  GetCurrentYear,
  GenerateDates,
  InsertStatement,
  UpdateStatement,
  GetCurrentMonthFirstDay,
  GetCurrentMonthLastDay,
  InsertStatementTransCommit,
  GetCurrentDatetime,
} = require("./repository/customhelper");
const { Select, Insert, Update, Check } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
  JsonWarningResponse,
  MessageStatus,
  JsonSuccessMulti,
} = require("./repository/response");
const { REQUEST_STATUS, REQUEST, STATUS_LOG } = require("./repository/enums");
const { SendEmailNotification } = require("./repository/emailsender");
const { Transaction } = require("./utility/utility");
const { SendEmployeeNotification } = require("./repository/helper");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportaldtrlayout', { title: 'Express' });
  Validator(req, res, "loantypelayout", "loantype");
});

module.exports = router;

router.get("/getloantype", (req, res) => {
  try {
    let sql = SelectStatement("select * from loan_type", []);

    Select(sql, (error, result) => {
      if (error) {
        res.status(500).json(JsonErrorResponse(error));
      }

      if (result.length != 0) {
        let data = DataModeling(result, "lt_");
        res.status(200).json(JsonDataResponse(data));
      } else {
        res.status(200).json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});

router.post("/save", (req, res) => {
  try {
    const { loantype, governmentagency } = req.body;

    async function ProcessData() {
      let createby = req.session.fullname;
      let createdate = GetCurrentDatetime();

      let sql = InsertStatement("loan_type", "lt", [
        "name",
        "gov_agency",
        "createby",
        "createdate",
      ]);
      let data = [[loantype, governmentagency, createby, createdate]];

      let checkStatement = SelectStatement(
        "select * from loan_type where lt_name = ? and lt_gov_agency = ?",
        [loantype, governmentagency]
      );

      let checkResult = await Check(checkStatement);
      if (checkResult.length > 0) {
        return res
          .status(400)
          .json(JsonWarningResponse("Loan Type Already Exist"));
      }

      Insert(sql, data, (err, result) => {
        if (err) {
          console.error("Error: ", err);
          res.status(500).json(JsonErrorResponse(err));
        }

        if (result != 0) {
          let data = DataModeling(result, "lt_");
          res.status(200).json(JsonDataResponse(data));
        } else {
          res.status(200).json(JsonDataResponse(result));
        }
      });
    }

    ProcessData();
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});

router.put("/update", (req, res) => {
  try {
    const { loantypeid, loantype, governmentagency } = req.body;

    async function ProcessData() {
      let createby = req.session.fullname;
      let createdate = GetCurrentDatetime();

      let sql = UpdateStatement(
        "loan_type",
        "lt",
        ["name", "gov_agency", "createby", "createdate"],
        ["typeid"]
      );
      let data = [loantype, governmentagency, createby, createdate, loantypeid];

      let checkStatement = SelectStatement(
        "select * from loan_type where lt_name = ? and lt_gov_agency = ?",
        [loantype, governmentagency]
      );

      let checkResult = await Check(checkStatement);
      if (checkResult.length > 0) {
        return res.status(200).json(JsonWarningResponse("exist"));
      }

      Update(sql, data, (err, result) => {
        if (err) {
          console.error("Error: ", err);
          res.status(500).json(JsonErrorResponse(err));
        }

        if (result != 0) {
          res.status(200).json(JsonSuccess());
        } else {
          res.status(200).json(JsonDataResponse(result));
        }
      });
    }

    ProcessData();
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});
