const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonWarningResponse,
  JsonSuccess,
  MessageStatus,
} = require("./repository/response");
const { Select, Update, InsertTable } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { GetValue, ACT, INACT, NPD } = require("./repository/dictionary");
const {
  GetCurrentDatetime,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
  SelectStatementWithArray,
  UpdateStatementWithArrayDates,
} = require("./repository/customhelper");
const e = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "eportalgovloanslayout", "eportalgovloans");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT 
      gl_loanid,
      gl_loan_type,
      gl_per_month,
      gl_amount_recieved,
      gl_createdate,
      gl_createby,
      gl_status 
      FROM gov_loans
      INNER JOIN master_employee ON gov_loans.gl_employeeid = me_id
      WHERE gl_employeeid = '${employeeid}';
      `;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "gl_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.get("/loadreq", (req, res) => {
  try {
    let sql = `SELECT 
      pd_payrollid, 
      pd_name, 
      pd_cutoff, 
      pd_startdate, 
      pd_enddate, 
      DATE_FORMAT(pd_payrolldate, '%Y-%m-%d') AS pd_payrolldate
      FROM payroll_date
      WHERE YEAR(pd_payrolldate) = YEAR(CURDATE())
      AND (DAY(pd_payrolldate) = 15 OR pd_payrolldate = LAST_DAY(pd_payrolldate))
      ORDER BY pd_payrolldate`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pd_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/save", (req, res) => {
  try {
    let status = GetValue(ACT());
    let createdby = req.session.fullname;
    let createddate = GetCurrentDatetime();
    const {
      employeeid,
      loan_type,
      amount_recieved,
      per_month,
      payment_type,
      effective_date,
      duration,
    } = req.body;

    let adjusted_per_month = per_month;
    let adjusted_duration = duration;

    if (payment_type === "Monthly") {
      adjusted_per_month /= 2;
      adjusted_duration *= 2;
    }

    let sql = InsertStatement("gov_loans", "gl", [
      "employeeid",
      "loan_type",
      "amount_recieved",
      "per_month",
      "payment_type",
      "affective_date",
      "duration",
      "createdate",
      "status",
      "createby",
    ]);
    let data = [
      [
        employeeid,
        loan_type,
        amount_recieved,
        adjusted_per_month,
        payment_type,
        effective_date,
        adjusted_duration,
        createddate,
        status,
        createdby,
      ],
    ];
    let checkStatement = SelectStatement(
      "select * from gov_loans where gl_employeeid=? and gl_loan_type=? and gl_status=?",
      [employeeid, loan_type, status]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          InsertTable(sql, data, (err, insertResult) => {
            if (err) {
              console.log(err);
              res.json(JsonErrorResponse(err));
            }

            let loanId = insertResult[0].id;
            let forecastDates = generateForecastDates(
              effective_date,
              adjusted_duration
            );
            let loanstatus = GetValue(NPD());
            let payment_type = "VIA PAYSLIP";

            let detailsData = forecastDates.map((date) => [
              employeeid,
              loanId,
              date.toISOString().split("T")[0],
              loanstatus,
              payment_type,
            ]);
            let detailsSql = InsertStatement("gov_loan_details", "gld", [
              "employeeid",
              "loanid",
              "payrolldates",
              "loanstatus",
              "payment_type",
            ]);

            InsertTable(detailsSql, detailsData, (err, result) => {
              if (err) {
                console.log(err);
                res.json(JsonErrorResponse(err));
              } else {
                res.json(JsonSuccess());
              }
            });
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getgovloans", (req, res) => {
  try {
    let govloanid = req.body.govloanid;
    let sql = `SELECT
      gld_payrolldates as gld_payrolldates,
      gl_loan_type as gld_loan_type,
      gl_per_month as gld_per_month,
      concat(me_lastname,' ',me_firstname) as gld_fullname,
      gld_loanstatus as gld_loanstatus,
      DATE_FORMAT(gld_paid_dates, "%M %d %Y") as gld_paid_dates,
      gld_payment_type
      FROM gov_loan_details
      INNER JOIN gov_loans ON gov_loan_details.gld_loanid = gl_loanid
      INNER JOIN master_employee ON gov_loan_details.gld_employeeid = me_id
      WHERE gld_loanid = '${govloanid}'
      ORDER BY gld_payrolldates DESC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "gld_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

//#region FUNCTION
function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}
//#endregion
