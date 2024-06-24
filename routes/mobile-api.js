const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  MessageStatus,
  JsonWarningResponse,
} = require("./repository/response");
const { UserLogin } = require("./repository/helper");
const { DataModeling } = require("./model/hrmisdb");
const e = require("express");
var router = express.Router();
const currentDate = moment();
const { Encrypter } = require("./repository/crytography");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalrequestovertimelayout', { title: 'Express' });
  Validator(req, res, "mobile-api", "mobile-api");
});

module.exports = router;



router.post("/login", (req, res) => {
  try {
    const { username, password,} = req.body;

    Encrypter(password, (err, encrypted) => {
      if (err) console.error("Error: ", err);

      let sql = `SELECT 
        mu_employeeid AS employeeid,
        CONCAT(me_firstname, ' ', me_lastname) AS fullname,
        ma_accessname AS accesstype,
        mu_status AS status,
        me_profile_pic AS image,
        me_jobstatus AS jobstatus,
        md_departmentid AS departmentid,
        md_departmentname AS departmentname,
        mp_positionname AS position,
        ma_accessid as accessid,
        mgs_id AS geofenceid
        FROM master_user
        INNER JOIN master_access ON mu_accesstype = ma_accessid
        LEFT JOIN master_employee ON mu_employeeid = me_id
        LEFT JOIN master_department ON md_departmentid = me_department
        LEFT JOIN master_position ON mp_positionid = me_position
        LEFT JOIN master_geofence_settings ON mgs_departmentid = me_department 
        WHERE mu_username = '${username}' AND mu_password = '${encrypted}'
        AND mu_accesstype = '2'`;

      mysql.mysqlQueryPromise(sql)
        .then((result) => {
          if (result.length !== 0) {
            const user = result[0];

            if (
              user.jobstatus === "probitionary" ||
              user.jobstatus === "regular" ||
              user.jobstatus === "apprentice"
            ) {
              if (user.status === "Active") {
                let data = UserLogin(result);

                data.forEach((user) => {
                  req.session.employeeid = user.employeeid;
                  req.session.fullname = user.fullname;
                  req.session.accesstype = user.accesstype;
                  req.session.image = user.image;
                  req.session.departmentid = user.departmentid;
                  req.session.departmentname = user.departmentname;
                  req.session.position = user.position;
                  req.session.jobstatus = user.jobstatus;
                  req.session.geofenceid = user.geofenceid;
                  req.session.accessid = user.accessid;
                });
                console.log('accesstype',req.session.accesstype);
                return res.json({
                  msg: "success",
                  data: data,
                });
              } else {
                return res.json({
                  msg: "inactive",
                });
              }
            } else {
              return res.json({
                msg: "resigned",
              });
            }
          } else {
            return res.json({
              msg: "incorrect",
            });
          }
        })
        .catch((error) => {
          return res.json({
            msg: "error",
            data: error,
          });
        });
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});


router.post("/loadovertime", (req, res) => {
    try {
      let employeeid = req.body.employeeid;
      let sql = `SELECT
      pao_id,
      DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS pao_attendancedate,
      DATE_FORMAT(pao_clockin, '%d %M %Y, %h:%i %p') AS pao_clockin,
      DATE_FORMAT(pao_clockout, '%d %M %Y, %h:%i %p') AS pao_clockout,
      pao_total_hours,
      pao_early_ot,
      pao_normal_ot,
      pao_night_differentials,
      pao_payroll_date,
      pao_status
      FROM payroll_approval_ot
      WHERE pao_employeeid = '${employeeid}'
      AND pao_status = 'Pending'`;
  
      Select(sql, (err, result) => {
        if (err) {
          console.error(err);
          res.json(JsonErrorResponse(err));
        }
  
        console.log(result);
  
        if (result != 0) {
          let data = DataModeling(result, "pao_");
  
          console.log(data);
          res.json(JsonDataResponse(data));
        } else {
          res.json(JsonDataResponse(result));
        }
      });
    } catch (error) {
      res.json({
        msg: "error",
        error,
      });
    }
  });


  router.post("/loadcoa", (req, res) => {
    try {
      let employeeid = req.body.employeeid;
      let sql = `SELECT 
      ar_requestid,
      DATE_FORMAT(ar_attendace_date, '%Y-%m-%d, %W') as ar_attendace_date,
      DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
      DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
      ar_total,
      ar_createdate,
      ar_status,
      ar_reason
    FROM attendance_request
    INNER JOIN
    master_employee ON attendance_request.ar_employeeid = me_id
    where ar_employeeid ='${employeeid}'`;
  
    Select(sql, (err, result) => {
        if (err) {
          console.error(err);
          res.json(JsonErrorResponse(err));
        }
  
        console.log(result);
  
        if (result != 0) {
          let data = DataModeling(result, "ar_");
  
          console.log(data);
          res.json(JsonDataResponse(data));
        } else {
          res.json(JsonDataResponse(result));
        }
      });
    } catch (error) {
      res.json({
        msg: "error",
        error,
      });
    }
  });


  router.post("/getovertime", (req, res) => {
    try {
      let approveot_id = req.body.approveot_id;
      let sql = `SELECT
    pao_id AS approvalid,
    JSON_UNQUOTE(JSON_EXTRACT(
        CASE DAYNAME(pao_attendancedate)
            WHEN 'Monday' THEN ms_monday
            WHEN 'Tuesday' THEN ms_tuesday
            WHEN 'Wednesday' THEN ms_wednesday
            WHEN 'Thursday' THEN ms_thursday
            WHEN 'Friday' THEN ms_friday
            WHEN 'Saturday' THEN ms_saturday
            WHEN 'Sunday' THEN ms_sunday
        END,
        '$.time_in'
    )) AS scheduledtimein,
    JSON_UNQUOTE(JSON_EXTRACT(
        CASE DAYNAME(pao_attendancedate)
            WHEN 'Monday' THEN ms_monday
            WHEN 'Tuesday' THEN ms_tuesday
            WHEN 'Wednesday' THEN ms_wednesday
            WHEN 'Thursday' THEN ms_thursday
            WHEN 'Friday' THEN ms_friday
            WHEN 'Saturday' THEN ms_saturday
            WHEN 'Sunday' THEN ms_sunday
        END,
        '$.time_out'
    )) AS scheduledtimeout,
    DATE_FORMAT(pao_attendancedate,  '%Y-%m-%d') AS attendancedate,
    date_format(pao_clockin, '%Y-%m-%d %H:%i:%s') AS clockin,
    date_format(pao_clockout, '%Y-%m-%d %H:%i:%s') AS clockout,
    pao_status
FROM payroll_approval_ot
INNER JOIN master_shift ON payroll_approval_ot.pao_employeeid = ms_employeeid
INNER JOIN master_employee ON master_shift.ms_employeeid = me_id
LEFT JOIN master_holiday ON pao_attendancedate = mh_date
INNER JOIN master_department ON master_employee.me_department = md_departmentid
INNER JOIN master_position ON master_employee.me_position = mp_positionid
WHERE pao_id = '${approveot_id}'`;
  
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