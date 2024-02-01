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

router.post('/load', (req, res) => {
    try {
      let ojtid = req.session.ojtid;
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
      ORDER BY oa_attendanceid DESC`;

      console.log(ojtid);
  
      mysql.mysqlQueryPromise(sql)
      .then((result) => {
          res.json({
              msg: 'success',
              data: result,
          });
      })
      .catch((error) => {
          res.json({
              msg:'error',
              data: error,
          });
      })
    } catch (error) {
      res.json({
        msg:'error',
        data: error,
      })
    }
  });

  router.post('/logs', (req, res) => {
    try {
        let attendanceid = req.body.attendanceid;
        let sql =  `      
        SELECT
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

        mysql.mysqlQueryPromise(sql)
        .then((result) => {
            res.json({
                msg:'success',
                data: result,
            });
        })
        .catch((error) => {
            res.json({
                msg:error,
            });
        })
    } catch (error) {
        res.json({
            msg:error,
        });
        
    }
});