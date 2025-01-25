const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { GetCurrentMonthFirstDay } = require("./repository/customhelper");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('salarylayout', { title: 'Express' });
  Validator(req, res, "setpayrolldatelayout", "setpayrolldate");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    pd_payrollid,
    pd_name,
    pd_cutoff,
    DATE_FORMAT(pd_startdate, '%Y-%m-%d') AS pd_startdate,
    DATE_FORMAT(pd_enddate, '%Y-%m-%d') AS pd_enddate,
    DATE_FORMAT(pd_payrolldate, '%Y-%m-%d') AS pd_payrolldate
    FROM payroll_date`;

    mysql.Select(sql, "Payroll_Date", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      mag: "error",
      data: error,
    });
  }
});

router.get("/loadreq", (req, res) => {
  try {
    let firstDayofMonth = GetCurrentMonthFirstDay();
    let sql = `SELECT 
            pd_payrollid,
            pd_name,
            pd_cutoff,
            DATE_FORMAT(pd_startdate, '%Y-%m-%d') AS pd_startdate,
            DATE_FORMAT(pd_enddate, '%Y-%m-%d') AS pd_enddate,
            DATE_FORMAT(pd_payrolldate, '%Y-%m-%d') AS pd_payrolldate
            FROM 
            payroll_date
            WHERE
            pd_startdate = (
              SELECT CASE 
                WHEN DAY(CURRENT_DATE) <= 11 THEN DATE_FORMAT(DATE_ADD(CURRENT_DATE, INTERVAL -1 MONTH), '%Y-%m-26') -- Previous month's 26th
                WHEN DAY(CURRENT_DATE) <= 26 THEN DATE_FORMAT(CURRENT_DATE, '%Y-%m-11') -- Current month's 11th
                ELSE DATE_FORMAT(CURRENT_DATE, '%Y-%m-26') -- Current month's 26th
                    END
            )  `;

    mysql.Select(sql, "Payroll_Date", (err, result) => {
      if (err) console.error("Error: ", err);

      //
      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      mag: "error",
      data: error,
    });
  }
});

router.get("/loadreqbeforepayout", (req, res) => {
  try {
    let firstDayofMonth = GetCurrentMonthFirstDay();
    let sql = `
    SELECT 
    pd_payrollid,
    pd_name,
    pd_cutoff,
    DATE_FORMAT(pd_startdate, '%Y-%m-%d') AS pd_startdate,
    DATE_FORMAT(pd_enddate, '%Y-%m-%d') AS pd_enddate,
    DATE_FORMAT(pd_payrolldate, '%Y-%m-%d') AS pd_payrolldate
    FROM 
    payroll_date
    WHERE
    CURRENT_DATE() BETWEEN pd_startdate AND pd_enddate `;

    mysql.Select(sql, "Payroll_Date", (err, result) => {
      if (err) console.error("Error: ", err);

      //
      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      mag: "error",
      data: error,
    });
  }
});

router.post("/generate", (req, res) => {
  try {
    const { year } = req.body;
    if (!year) {
      throw new Error("Year is required");
    }
    const payrollDates = [];

    for (let month = 0; month < 12; month++) {
      const currentYear = year;
      const startOfMonthDate = new Date(currentYear, month, 1);
      const endOfMonthDate = new Date(currentYear, month + 1, 0);
      const firstCutoffStartDate = new Date(
        month === 0 ? currentYear - 1 : currentYear,
        month === 0 ? 11 : month - 1,
        26
      );

      const firstCutoffEndDate =
        month === 0 && new Date(currentYear, month, 10).getDate() < 26
          ? new Date(currentYear, month, 10)
          : new Date(currentYear, month, 10);

      const payrollDate = new Date(currentYear, month, 15);
      const secondCutoffStartDate = new Date(currentYear, month, 11);
      const secondCutoffEndDate = new Date(currentYear, month, 25);

      payrollDates.push([
        `${new Intl.DateTimeFormat("en-US", {
          month: "long",
        }).format(startOfMonthDate)} First Cutoff`,
        "1st Cut Off",
        formatDate(firstCutoffStartDate),
        formatDate(firstCutoffEndDate),
        formatDate(payrollDate),
      ]);

      payrollDates.push([
        `${new Intl.DateTimeFormat("en-US", {
          month: "long",
        }).format(startOfMonthDate)} Second Cutoff`,
        "2nd Cut Off",
        formatDate(secondCutoffStartDate),
        formatDate(secondCutoffEndDate),
        formatDate(endOfMonthDate),
      ]);
    }

    let sql = `SELECT * FROM payroll_date WHERE YEAR(pd_payrolldate) = '${year}'`;

    mysql.Select(sql, "Payroll_Date", (err, result) => {
      if (err) {
        console.error("Error", err);
        res.json({ msg: "error" });
        return;
      }

      if (result.length != 0) {
        res.json({ msg: "exist" });
        return;
      }

      mysql.InsertTable("payroll_date", payrollDates, (err, result) => {
        if (err) {
          console.error("Error :", err);
          return res.json({
            msg: "error",
            data: err,
          });
        }

        res.json({
          msg: "success",
          data: result,
        });
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error.message,
    });
  }
});

function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}
