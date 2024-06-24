const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();
const XLSX = require("xlsx");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(
    req,
    res,
    "teamleadattendancelayout",
    "teamleadattendance"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `SELECT
      ma_attendanceid as attendanceid,
      CONCAT(me_lastname, " ", me_firstname) as employeeid,
      DATE_FORMAT(ma_attendancedate, '%W, %M %e, %Y') as attendancedate,
      TIME_FORMAT(ma_clockin, '%H:%i:%s') as clockin,
      TIME_FORMAT(ma_clockout, '%H:%i:%s') as clockout,
      ma_devicein as devicein,
      ma_deviceout as deviceout,
      CONCAT(
          FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
          FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
      ) AS totalhours
      FROM master_attendance
      LEFT JOIN master_employee ON ma_employeeid = me_id
      WHERE me_department = '${departmentid}'
      ORDER BY ma_attendanceid DESC`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    console.log("error", error);
  }
});

router.get("/loadexport", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = ` 
    SELECT 
    me_id as newEmployeeId,
    CONCAT(master_employee.me_lastname, " ", master_employee.me_firstname) AS firstname,
    me_phone as phone,
    me_email as email,
    me_jobstatus as jobstatus,
    md_departmentname AS me_department,
    mp_positionname AS me_position
    FROM
    master_employee
    LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN master_position ON master_employee.me_position = mp_positionid
    WHERE
    me_jobstatus IN ('regular', 'probitionary','apprentice')
    AND me_department = '${departmentid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
});
