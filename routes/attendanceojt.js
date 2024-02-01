const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const e = require("express");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('attendancelayout', { title: 'Express' });

  Validator(req, res, "attendanceojtlayout");
});


module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT
    mo_image as image,
    oa_attendanceid as attendanceid,
    CONCAT(mo_lastname, " ", mo_name) as employeeid,
    DATE_FORMAT(oa_attendancedate, '%W, %M %e, %Y') as attendancedate,
    TIME_FORMAT(oa_clockin, '%H:%i:%s') as clockin,
    TIME_FORMAT(oa_clockout, '%H:%i:%s') as clockout,
    oa_devicein as devicein,
    oa_deviceout as deviceout,
    CONCAT(
        FLOOR(TIMESTAMPDIFF(SECOND, oa_clockin, oa_clockout) / 3600), 'h ',
        FLOOR((TIMESTAMPDIFF(SECOND, oa_clockin, oa_clockout) % 3600) / 60), 'm'
    ) AS totalhours
    FROM ojt_attendance
    LEFT JOIN master_ojt ON oa_ojtid = mo_id
    ORDER BY oa_attendancedate DESC`;

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
    let sql = `SELECT
    mo_image AS image,
    CONCAT(mo_lastname, ' ', mo_name) AS fullname,
    DATE_FORMAT(oal_logdatetime, '%W, %M %e, %Y') AS logdate,
    TIME(oal_logdatetime) AS logtime,
    oal_logtype AS logtype,
    oal_latitude AS latitude,
    oal_longitude AS longitude,
    oal_device AS device,
    mgs_location AS location,
    SQRT(POW(mgs_latitude - oal_latitude, 2) + POW(mgs_longitude - oal_longitude, 2)) * 111.32 AS distance
    FROM
    master_ojt
    INNER JOIN
    ojt_attendance_logs ON mo_id = oal_ojtid
    LEFT JOIN
    master_geofence_settings ON mo_department = mgs_departmentid
    WHERE
    oal_attendanceid = '${attendanceid}'
    HAVING
    distance <= 1`;

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
