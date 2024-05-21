const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(req, res, "attendance_request_activitylayout");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    ara.ara_id as requsetid,
    CONCAT(me_request.me_lastname, ' ', me_request.me_firstname) AS employeeid,
    ar.ar_attendace_date as attendancedate,
    DATE_FORMAT(ar.ar_timein, '%W, %M %e, %Y') AS timein,
    DATE_FORMAT(ar.ar_timeout, '%W, %M %e, %Y') AS timeout,
    ar.ar_total as totalhours,
    CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS approver,
    ara.ara_date as actiondate,
    ara.ara_status as status
    FROM attendance_request_activity ara
    INNER JOIN attendance_request ar ON ara.ara_requestid = ar.ar_requestid
    INNER JOIN master_employee me_request ON ar.ar_employeeid = me_request.me_id
    INNER JOIN master_employee me_activity ON ara.ara_employeeid = me_activity.me_id`;

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      res.json({
        msg:'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg:'error',
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


router.post("/getattendanceactivity", (req, res) => {
  try {
    let requsetid = req.body.requsetid;
    let sql = `SELECT 
    ara.ara_id as requsetid,
    CONCAT(me_request.me_lastname, ' ', me_request.me_firstname) AS employeeid,
    ar.ar_attendace_date as attendancedate,
    DATE_FORMAT(ar.ar_timein, '%Y-%m-%dT%H:%i') AS timein,
    DATE_FORMAT(ar.ar_timeout, '%Y-%m-%dT%H:%i') AS timeout,
    ar.ar_total totalhours,
    ar.ar_reason as reason,
    DATE_FORMAT(ar.ar_createdate, '%Y-%m-%dT%H:%i') as applieddate,
    CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS approver,
    ara.ara_date as actiondate,
    ara.ara_status as status,
    ar.ar_file as file,
    ar.ar_approvalcount as approvalcount,
    s_name as subgroupname
    FROM attendance_request_activity ara
    INNER JOIN attendance_request ar ON ara.ara_requestid = ar.ar_requestid
    INNER JOIN master_employee me_request ON ar.ar_employeeid = me_request.me_id
    INNER JOIN master_employee me_activity ON ara.ara_employeeid = me_activity.me_id
    INNER JOIN subgroup on ara.ara_subgroupid = s_id
    WHERE ara_id = '${requsetid}'`;

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      res.json({
        msg:'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg:'error',
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


