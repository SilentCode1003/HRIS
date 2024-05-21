const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { ValidatorForTeamLead } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();


/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  ValidatorForTeamLead(req, res, 'teamleadpendingcoalayout');
});

module.exports = router;

// router.get("/load", (req, res) => {
//   try {
//     let departmentid = req.session.departmentid;
//     let subgroupid = req.session.subgroupid;
//     let sql = `SELECT 
//     me_profile_pic,
//     ar_requestid,
//     concat(me_lastname,' ',me_firstname) as ar_employeeid,
//     DATE_FORMAT(ar_attendace_date, '%Y-%m-%d, %W') as ar_attendace_date,
//     DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
//     DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
//     ar_total,
//     ar_createdate,
//     ar_status
//   FROM attendance_request
//   INNER JOIN
//   master_employee ON attendance_request.ar_employeeid = me_id
//   WHERE me_department = '${departmentid}' AND ar_status = 'Pending' and ar_subgroupid = '${subgroupid}'
//   AND ar_employeeid NOT IN (
//     SELECT tu_employeeid FROM teamlead_user)`;

//     mysql.Select(sql, "Attendance_Request", (err, result) => {
//       if (err) console.error("Error Fetching Data: ", err);

//       res.json({
//         msg: "success",
//         data: result,
//       });
//     });
//   } catch (error) {
//     res.json({
//       msg: "error",
//       data: error,
//     });
//   }
// });


router.get("/load", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
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
    WHERE ar_status = 'Pending' AND ar_subgroupid = '${subgroupid}'
    AND me_department = '${departmentid}'
    AND ar_employeeid NOT IN (
        SELECT tu_employeeid FROM teamlead_user)
      AND ar_approvalcount = (
        SELECT ats_count
        FROM aprroval_stage_settings
        WHERE ats_accessid = '${accesstypeid}'
    )`;

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



router.get("/loadactionname", (req, res) => {
  try {
    let accesstypeid = req.session.accesstypeid;
    let sql = `select
    ats_approvename,
    ats_rejectname
    from aprroval_stage_settings
    where ats_accessid = '${accesstypeid}'`;

    console.log(accesstypeid,'id');

    mysql.Select(sql, "Approval_Stage_Settings", (err, result) => {
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


router.post('/attendanceaction', (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let departmentid = req.session.departmentid;
    let subgroupid = req.session.subgroupid;
    let requestid = req.body.requestid;
    let status = req.body.status;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");

  
    let data = [];
  
    data.push([
      employeeid, departmentid, requestid, subgroupid, status, createdate,
    ])
    
    mysql.InsertTable('attendance_request_activity', data, (err, result) => {
      if (err) console.error('Error: ', err);

      console.log(result);

      res.json({
        msg: 'success'
      })
    });
  } catch (error) {
    res.json({
      msg: 'error'
    })
  }
});