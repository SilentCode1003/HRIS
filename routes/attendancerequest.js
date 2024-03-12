const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('candidatelayout', { title: 'Express' });

  Validator(req, res, "attendancerequestlayout");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
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
      master_employee ON attendance_request.ar_employeeid = me_id`;

    mysql.Select(sql, "Attendance_Request", (err, result) => {
      if (err) console.error("Error Fetching Data: ", err);

      console.log(result);
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
        ar_reason
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

router.post("/update", (req, res) => {
    try {
      let requestid = req.body.requestid;
      let requeststatus = req.body.requeststatus;
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
      
      if (requeststatus === "Approved") {
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
  
        mysql.InsertTable("master_attendance_request", data, (err, result) => {
          if (err) {
            console.error("Error Insert Attendance: ", err);
            return res.json({
              msg: 'error',
              data: err,
            });
          }
  
          console.log(result);
  
          
          let sql = `UPDATE attendance_request SET ar_status = 'Approved' WHERE ar_requestid = '${requestid}'`;
  
          mysql.Update(sql)
            .then(() => {
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
        });
      } else {
        res.json({
          msg: 'error',
          data: "Request status must be 'Approved' to proceed.",
        });
      }
    } catch (error) {
      res.json({
        msg: "error",
        data: error,
      });
    }
  });
  
