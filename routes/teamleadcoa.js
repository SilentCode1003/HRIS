const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { ValidatorForTeamLead } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();


/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  ValidatorForTeamLead(req, res, 'teamleadcoalayout');
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let subgroupid = req.session.subgroupid;
    let sql = `SELECT 
    me_profile_pic,
    ar_requestid,
    concat(me_lastname,' ',me_firstname) as ar_employeeid,
    DATE_FORMAT(ar_attendace_date, '%Y-%m-%d, %W') as ar_attendace_date,
    DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
    DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
    ar_total,
    ar_createdate,
    ar_status
  FROM attendance_request
  INNER JOIN
  master_employee ON attendance_request.ar_employeeid = me_id
  WHERE me_department = '${departmentid}' and ar_subgroupid = '${subgroupid}'
  AND ar_employeeid NOT IN (
    SELECT tu_employeeid FROM teamlead_user)`;

    mysql.Select(sql, "Attendance_Request", (err, result) => {
      if (err) console.error("Error Fetching Data: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/getattendancerequest", (req, res) => {
  try {
    let requestid = req.body.requestid;
    let sql = `    
      SELECT 
        me_id,
        me_profile_pic,
        concat(me_lastname,' ',me_firstname) as ar_employeeid,
        ar_attendace_date,
        DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
        DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
        ar_total,
        ar_createdate,
        ar_status,
        ar_reason,
        ar_file
      FROM attendance_request
      INNER JOIN
      master_employee ON attendance_request.ar_employeeid = me_id
      WHERE ar_requestid = '${requestid}'
      ORDER BY ar_requestid`;

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


router.post("/updateMasterAttendance", (req, res) => {
  try {
    let emp_id = req.body.emp_id;
    let attendancedate = req.body.attendancedate;
    let timein = req.body.timein;
    let timeout = req.body.timeout;
    let latitudein = "14.337957";
    let latitudeout = "14.337957";
    let longitudein = "121.060336";
    let longitudeout = "121.060336";
    let geofencein = "1";
    let geofenceout = "1";
    let devicein = "app";
    let deviceout = "app";
    let data = [];

    console.log(data);

    let selectQuery = `SELECT * FROM master_attendance WHERE ma_employeeid = '${emp_id}' AND ma_attendancedate = '${attendancedate}'`;
    mysql.Select(selectQuery, "Master_Attendance", (selectErr, selectResult) => {
      if (selectErr) {
        console.error("Error checking attendance record:", selectErr);
        return res.json({
          msg: 'error',
          data: selectErr,
        });
      }

      if (selectResult.length > 0) {
        let updateSql = `UPDATE master_attendance SET 
        ma_employeeid = '${emp_id}', 
        ma_attendancedate = '${attendancedate}',
        ma_clockin = '${timein}', 
        ma_clockout = '${timeout}',
        ma_latitudeIn = '${latitudein}', 
        ma_longitudein = '${longitudein}',
        ma_latitudeout = '${latitudeout}', 
        ma_longitudeout = '${longitudeout}',
        ma_gefenceidIn = '${geofencein}', 
        ma_geofenceidOut = '${geofenceout}',
        ma_devicein = '${devicein}', 
        ma_deviceout = '${deviceout}' 
        WHERE ma_employeeid = '${emp_id}' 
        AND ma_attendancedate = '${attendancedate}'`;
        mysql.Update(updateSql)
          .then((result) => {
            res.json({
              msg: 'success',
              data: result,
            });
          })
          .catch((error) => {
            res.json({
              msg: 'error',
              data: error,
            });
          });
      } else {
        data.push([
          emp_id,
          attendancedate,
          timein,
          timeout,
          latitudein,
          latitudeout,
          longitudein,
          longitudeout,
          geofencein,
          geofenceout,
          devicein,
          deviceout
        ]);

        mysql.InsertTable("master_attendance_request", data, (insertErr, insertResult) => {
          if (insertErr) {
            console.error("Error Insert Attendance: ", insertErr);
            return res.json({
              msg: 'error',
              data: insertErr,
            });
          }

          res.json({
            msg: 'success',
            data: insertResult,
          });
        });
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});


router.post("/updateAttendanceRequest", (req, res) => {
  try {
    let requestid = req.body.requestid;

    let sql = `UPDATE attendance_request SET ar_status = 'Approved' WHERE ar_requestid = '${requestid}'`;

    mysql.Update(sql)
      .then((result) => {
        res.json({
          msg: 'success',
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: 'error',
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