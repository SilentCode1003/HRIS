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
  //res.render('govermentidlayout', { title: 'Express' });
  Validator(req, res, "gov_loanslayout", "gov_loans");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    gl_loanid,
    concat(me_lastname,' ',me_firstname) as gl_fullname,
    gl_loan_type,
    gl_per_month,
    gl_amount_recieved,
    gl_createdate,
    gl_createby,
    gl_status 
    FROM gov_loans
    INNER JOIN master_employee ON gov_loans.gl_employeeid = me_id;
    `;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      console.log(result);

      if (result != 0) {
        let data = DataModeling(result, "gl_");

        console.log(data);
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

      console.log(result);

      if (result != 0) {
        let data = DataModeling(result, "pd_");

        console.log(data);
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
        console.log(result);
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          InsertTable(sql, data, (err, insertResult) => {
            if (err) {
              console.log(err);
              res.json(JsonErrorResponse(err));
            }

            let loanId = insertResult[0].id;
            let forecastDates = generateForecastDates(effective_date, adjusted_duration);
            let loanstatus = GetValue(NPD());
            let payment_type = 'VIA PAYSLIP';

            let detailsData = forecastDates.map((date) => [
              employeeid,
              loanId,
              date.toISOString().split("T")[0],
              loanstatus,
              payment_type,
            ]);

            console.log(detailsData, "Dates");

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

      console.log(result);

      if (result != 0) {
        let data = DataModeling(result, "gld_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getgovloansadvanced", (req, res) => {
  try {
    let govloanid = req.body.govloanid;
    let sql = `SELECT
    DATE_FORMAT(gld_payrolldates, '%Y-%m-%d') AS gld_payrolldates,
    gl_loan_type as gld_loan_type,
    gl_per_month as gld_per_month,
    gld_employeeid,
    gld_loanstatus,
    gl_amount_recieved as gld_amount_recieved
    FROM gov_loan_details
    INNER JOIN gov_loans ON gov_loan_details.gld_loanid = gl_loanid
    INNER JOIN master_employee ON gov_loan_details.gld_employeeid = me_id
    WHERE gld_loanid = '${govloanid}' 
    AND gld_loanstatus = 'NOT PAID'
    ORDER BY gld_payrolldates ASC`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      console.log(result);

      if (result != 0) {
        let data = DataModeling(result, "gld_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.put("/edit", (req, res) => {
  try {
    const {
      govloanid,
      paid_date,
      payment_type,
      selected_dates,
      employeeid,
      loan_type,
    } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (paid_date) {
      data.push(paid_date);
      columns.push("paid_dates");
    }

    if (payment_type) {
      data.push(payment_type);
      columns.push("payment_type");

      let loanstatus = payment_type === "VIA OTC" ? "PAID" : "NOT PAID";
      data.push(loanstatus);
      columns.push("loanstatus");
    }

    // if (payment_type === "VIA PAYSLIP") {
    //   data.push("NOT PAID");
    //   columns.push("loanstatus");
    // }

    if (selected_dates) {
      data.push(selected_dates);
      arguments.push("payrolldates");
    }

    if (govloanid) {
      data.push(govloanid);
      arguments.push("loanid");
    }

    let updateStatement = UpdateStatementWithArrayDates(
      "gov_loan_details",
      "gld",
      ["paid_dates", "payment_type", "loanstatus"],
      ["payrolldates"],
      "loanid"
    );

    console.log(updateStatement);

    let checkStatement = SelectStatementWithArray(
      "SELECT * FROM gov_loan_details INNER JOIN gov_loans ON gov_loan_details.gld_loanid = gl_loanid WHERE gld_employeeid = ? AND gld_payrolldates IN (?) AND gld_loanstatus = ? AND gl_loan_type = ?",
      [employeeid, selected_dates, "PAID", loan_type]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);

            console.log(result);

            res.json(JsonSuccess());
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

//#region FUNCTION
// no additional hours
// function generateForecastDates(effectiveDate, duration) {
//     let dates = [];
//     let currentDate = new Date(effectiveDate);

//     console.log("Effective Date:", currentDate);
//     console.log("Duration:", duration);

//     currentDate.setHours(0, 0, 0, 0);
//     dates.push(new Date(currentDate));

//     for (let i = 1; i < duration; i++) {
//         if (currentDate.getDate() === 15) {
//             currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
//         } else {
//             currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 15);
//         }
//         currentDate.setHours(0, 0, 0, 0);
//         dates.push(new Date(currentDate));
//     }

//     console.log("Final Dates Array:", dates);
//     return dates;
// }

function generateForecastDates(effectiveDate, duration) {
  let dates = [];
  let currentDate = new Date(effectiveDate);

  console.log("Effective Date:", currentDate);
  console.log("Duration:", duration);

  currentDate.setHours(8, 0, 0, 0);
  dates.push(new Date(currentDate));

  for (let i = 1; i < duration; i++) {
    if (currentDate.getDate() === 15) {
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
    } else {
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        15
      );
    }
    currentDate.setHours(8, 0, 0, 0);
    dates.push(new Date(currentDate));
  }

  console.log("Final Dates Array:", dates);
  return dates;
}

function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}
//#endregion
