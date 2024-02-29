const mysql = require("./repository/hrmisdb");
var express = require("express");
const { ValidatorforOjt } = require("./controller/middleware");
var router = express.Router();
const bodyParser = require("body-parser");
const moment = require("moment");
const { Attendance_Logs } = require("./model/hrmisdb");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportalindexlayout', { title: 'Express' });
  ValidatorforOjt(req, res, "ojtattendancelayout");
});

module.exports = router;

router.post("/load", (req, res) => {
  try {
    let ojtid = req.body.ojtid;
    let sql = `SELECT
      oa_attendanceid as attendanceid,
      CONCAT(mo_lastname, " ", mo_name) as ojtid,
      DATE_FORMAT(oa_attendancedate, '%W, %M %e, %Y') AS attendancedate,
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
       where oa_ojtid = '${ojtid}'
      ORDER BY oa_attendanceid DESC`;

    console.log(ojtid);

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


router.post("/loadforapp", (req, res) => {
  try {
    let ojtid = req.body.ojtid;
    let sql = `SELECT
    oa_attendanceid as attendanceid,
    CONCAT(mo_lastname, " ", mo_name) as employeeid,
    DATE_FORMAT(oa_attendancedate, '%W, %M %e, %Y') AS attendancedate,
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
     where oa_ojtid = '${ojtid}'
    ORDER BY oa_attendanceid DESC
    LIMIT 2`;

    console.log(ojtid);

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


router.post("/getloadforapp", (req, res) => {
  try {
    let ojtid = req.body.ojtid;
    let sql = `SELECT
    CONCAT(mo_lastname, " ", mo_name) as ojtid,
    TIME_FORMAT(oa_clockin, '%H:%i:%s') as clockin,
    TIME_FORMAT(oa_clockout, '%H:%i:%s') as clockout,
    DATE_FORMAT(oa_clockout, '%Y-%m-%d') as attendancedateout,
    DATE_FORMAT(oa_clockin, '%Y-%m-%d') as attendancedatein,
    oa_devicein as devicein,
    oa_deviceout as deviceout,
    CONCAT(
    FLOOR(TIMESTAMPDIFF(SECOND, oa_clockin, oa_clockout) / 3600), 'h ',
    FLOOR((TIMESTAMPDIFF(SECOND, oa_clockin, oa_clockout) % 3600) / 60), 'm'
    ) AS totalhours,
    mgsIn.mgs_geofencename AS geofencenameIn,
    mgsOut.mgs_geofencename AS geofencenameOut
    FROM ojt_attendance
    INNER JOIN master_ojt ON oa_ojtid = mo_id
    LEFT JOIN
    master_geofence_settings mgsIn ON oa_gefenceidIn = mgsIn.mgs_id
    LEFT JOIN
    master_geofence_settings mgsOut ON oa_geofenceidOut = mgsOut.mgs_id
    where oa_ojtid='${ojtid}'
    ORDER BY oa_attendancedate DESC
    limit 2`;

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

router.post("/filterforapp", (req, res) => {
  try {
    let ojtid = req.body.ojtid;
    let sql = `SELECT
    CONCAT(mo_lastname, " ", mo_name) as ojtid,
    TIME_FORMAT(oa_clockin, '%H:%i:%s') as clockin,
    TIME_FORMAT(oa_clockout, '%H:%i:%s') as clockout,
    DATE_FORMAT(oa_clockout, '%Y-%m-%d') as attendancedateout,
    DATE_FORMAT(oa_clockin, '%Y-%m-%d') as attendancedatein,
    oa_devicein as devicein,
    oa_deviceout as deviceout,
    CONCAT(
    FLOOR(TIMESTAMPDIFF(SECOND, oa_clockin, oa_clockout) / 3600), 'h ',
    FLOOR((TIMESTAMPDIFF(SECOND, oa_clockin, oa_clockout) % 3600) / 60), 'm'
    ) AS totalhours,
    mgsIn.mgs_geofencename AS geofencenameIn,
    mgsOut.mgs_geofencename AS geofencenameOut
    FROM ojt_attendance
    INNER JOIN master_ojt ON oa_ojtid = mo_id
    LEFT JOIN
    master_geofence_settings mgsIn ON oa_gefenceidIn = mgsIn.mgs_id
    LEFT JOIN
    master_geofence_settings mgsOut ON oa_geofenceidOut = mgsOut.mgs_id
    where oa_ojtid='${ojtid}'
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


router.post("/gethomestatus2", (req, res) => {
  try {
    let ojtid = req.body.ojtid;
    let attendancedate = req.body.attendancedate;
    let sql = `select 
	     	DATE_FORMAT(oa_clockin, '%W, %M %e, %Y') AS logdatein,
        TIME(oa_clockin) AS logtimein,
        DATE_FORMAT(oa_clockout, '%W, %M %e, %Y') AS logdateout,
        TIME(oa_clockout) AS logtimeout
        from ojt_attendance
        where oa_ojtid = '${ojtid}' and oa_attendancedate = '${attendancedate}'
        order by oa_attendancedate desc 
        limit 1`;
    console.log(sql);

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
 DATE_FORMAT(oal_logdatetime, '%W, %M %e, %Y') AS logdate,
 TIME(oal_logdatetime) AS logtime,
 oal_logtype AS logtype,
 oal_latitude AS latitude,
 oal_longitude AS longitude,
 oal_device AS device,
 mgs_geofencename as location
 from ojt_attendance_logs
 inner join master_ojt on ojt_attendance_logs.oal_ojtid = mo_id
 inner join master_geofence_settings on ojt_attendance_logs.oal_geofenceid = mgs_id
 where oal_attendanceid = '${attendanceid}'`;

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
