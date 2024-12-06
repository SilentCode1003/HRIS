const mysql = require("./repository/hrmisdb");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "eportalattendancelayout", "eportalattendance");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT
        ma_attendanceid AS attendanceid,
        CONCAT(me_lastname, ' ', me_firstname) AS employeeid,
        DATE_FORMAT(ma_attendancedate, '%W, %M %e, %Y') AS attendancedate,
        TIME_FORMAT(ma_clockin, '%H:%i:%s') AS clockin,
        TIME_FORMAT(ma_clockout, '%H:%i:%s') AS clockout, 
        ma_devicein AS devicein,
        ma_deviceout AS deviceout,
        CONCAT(
            FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
            FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
        ) AS totalhours
    FROM master_attendance
    LEFT JOIN master_employee ON ma_employeeid = me_id
    WHERE ma_employeeid = '${employeeid}'
    AND ma_attendancedate BETWEEN CURDATE() - INTERVAL 1 DAY AND CURDATE()
    ORDER BY ma_attendanceid DESC
    LIMIT 2`;

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


router.post("/daterange", (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let employeeid = req.session.employeeid;
    let sql = ` SELECT 
    ma_attendanceid as attendanceid,
    CONCAT(me_lastname, " ", me_firstname) as employeeid,
    DATE_FORMAT(ma_attendancedate, '%W, %M %e, %Y') as attendancedate,
    TIME_FORMAT(ma_clockin, '%h:%i %p') as clockin,
    TIME_FORMAT(ma_clockout, '%h:%i %p') as clockout,
    ma_devicein as devicein,
    ma_deviceout as deviceout,
     CONCAT(
            FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
            FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
        ) AS totalhours
    FROM master_attendance 
    LEFT JOIN master_employee ON ma_employeeid = me_id
    WHERE ma_attendancedate BETWEEN 
    '${startdate}' AND '${enddate}' AND ma_employeeid = '${employeeid}'`;

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
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/logs", (req, res) => {
  try {
    let attendanceid = req.body.attendanceid;
    let sql = ` select 
    me_profile_pic as image,
    concat(me_lastname,' ',me_firstname) as fullname,
	DATE_FORMAT(al_logdatetime, '%W, %M %e, %Y') AS logdate,
	TIME(al_logdatetime) AS logtime,
    al_logtype AS logtype,
	al_latitude AS latitude,
    al_longitude AS longitude,
	al_device AS device,
    al_location as location
    from attendance_logs
    inner join master_employee on attendance_logs.al_employeeid = me_id
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
