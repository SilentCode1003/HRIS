const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalrequestleavelayout', { title: 'Express' });
  Validator(req, res, "eportalrequestattendancelayout");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT * FROM attendance_request WHERE ar_employeeid = '${employeeid}'`;

    mysql.Select(sql, "Attendance_Request", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/submit", async (req, res) => {
  try {
    const employeeid = req.body.employeeid;
    const { attendancedate, timein, timeout, reason } = req.body;
    const createdate = currentDate.format("YYYY-MM-DD");
    const status = "Pending";
    const createby = 'On Process';

    const total = calculateTotalHours(timein, timeout);

    console.log(attendancedate, timein, timeout, reason, employeeid, total);

    const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
    const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

    if (employeeResult.length === 0) {
      return res.json({ msg: "Invalid employee ID" });
    }

    const data = [
      [employeeid, attendancedate, timein, timeout, total, createdate, createby, status, reason],
    ];

    mysql.InsertTable("attendance_request", data, (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error inserting leave record: ", insertErr);
        res.json({ msg: "insert_failed" });
      } else {
        console.log(insertResult);
        res.json({ msg: "success" });
      }
    });
  } catch (error) {
    console.error("Error in /submit route: ", error);
    res.json({ msg: "error" });
  }
});


function calculateTotalHours(timein, timeout) {
  const timeInParts = timein.split(":");
  const timeOutParts = timeout.split(":");
  const timeInHours = parseInt(timeInParts[0], 10);
  const timeInMinutes = parseInt(timeInParts[1], 10);
  const timeOutHours = parseInt(timeOutParts[0], 10);
  const timeOutMinutes = parseInt(timeOutParts[1], 10);

  let totalHours = timeOutHours - timeInHours;
  let totalMinutes = timeOutMinutes - timeInMinutes;

  if (totalMinutes < 0) {
    totalHours -= 1;
    totalMinutes += 60;
  }

  const totalHoursDecimal = totalHours + totalMinutes / 60;
  return totalHoursDecimal.toFixed(2);
}