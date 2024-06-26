const mysql = require("./repository/hrmisdb");
//const moment = require('moment');
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
//const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalattendancelayout', { title: 'Express' });
  Validator(req, res, "eportalattendancelayout", "eportalattendance");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT
      ma_attendanceid as attendanceid,
      CONCAT(me_lastname, " ", me_firstname) as employeeid,
      DATE_FORMAT(ma_attendancedate, '%W, %M %e, %Y') AS attendancedate,
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
       where ma_employeeid = '${employeeid}'
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

router.post("/logs", (req, res) => {
  try {
    let attendanceid = req.body.attendanceid;
    let sql = ` SELECT
      DATE_FORMAT(al_logdatetime, '%W, %M %e, %Y') AS logdate,
	  TIME(al_logdatetime) AS logtime,
      al_logtype AS logtype,
	  al_latitude AS latitude,
      al_longitude AS longitude,
	  al_device AS device,
      mgs_geofencename as location
      from attendance_logs
      inner join master_employee on attendance_logs.al_employeeid = me_id
      inner join master_geofence_settings on attendance_logs.al_geofenceid = mgs_id
      where al_attendanceid = '${attendanceid}'`;

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
          msg: error,
        });
      });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});
