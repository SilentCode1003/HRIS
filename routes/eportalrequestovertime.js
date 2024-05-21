const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalrequestovertimelayout', { title: 'Express' });
  Validator(req, res, "eportalrequestovertimelayout");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
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

    mysql.Select(sql, "Payroll_Approval_Ot", (err, result) => {
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


router.post('/getovertime', (req, res) => {
  try {
    let approveot_id = req.body.approveot_id;
    let sql = `
    SELECT
        pao_id AS approvalid,
        CASE 
            WHEN mh_date IS NOT NULL THEN mh_type
            WHEN (
                JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Monday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Tuesday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Wednesday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Thursday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Friday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Saturday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Sunday'
            )
            THEN 'Rest Day'
            ELSE TIME_FORMAT(
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
                )),
                '%h:%i %p'
            )
        END AS start_time,
        CASE 
            WHEN mh_date IS NOT NULL THEN mh_type
            WHEN (
                JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Monday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Tuesday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Wednesday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Thursday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Friday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Saturday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Sunday'
            )
            THEN 'Rest Day'
            ELSE TIME_FORMAT(
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
                )),
                '%h:%i %p'
            )
        END AS end_time,
        mp_positionname AS positionname,
        md_departmentname AS departmentname,
        pao_fullname AS fullname,
        DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS attendancedate,
        DATE_FORMAT(pao_clockin, '%Y-%m-%dT%H:%i') AS clockin,
        DATE_FORMAT(pao_clockout, '%Y-%m-%dT%H:%i') AS clockout,
        pao_total_hours AS totalhours,
        pao_early_ot AS earlyot,
        pao_normal_ot AS normalot,
        pao_night_differentials AS nightdiff,
        pao_payroll_date AS payrolldate,
        pao_status AS status,
        pao_reason AS reason
    FROM payroll_approval_ot
    INNER JOIN master_shift ON payroll_approval_ot.pao_employeeid = ms_employeeid
    INNER JOIN master_employee ON master_shift.ms_employeeid = me_id
    LEFT JOIN master_holiday ON pao_attendancedate = mh_date
    INNER JOIN master_department ON master_employee.me_department = md_departmentid
    INNER JOIN master_position ON master_employee.me_position = mp_positionid
    WHERE pao_id = '${approveot_id}'`;

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
    })
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});


router.post('/update', (req, res) => {
  try {
    let approveot_id = req.body.approveot_id;
    let totalhours = req.body.totalhours;
    let night_ot = req.body.night_ot;
    let normal_ot = req.body.normal_ot;
    let earlyot = req.body.earlyot;
    let reason = req.body.reason;
    let overtimestatus = req.body.overtimestatus;
    let sql = `UPDATE payroll_approval_ot SET 
    pao_total_hours = '${totalhours}',
    pao_night_differentials = '${night_ot}',
    pao_normal_ot = '${normal_ot}',
    pao_early_ot = '${earlyot}',
    pao_reason = '${reason}',
    pao_status = '${overtimestatus}'
    WHERE pao_id = '${approveot_id}'`;

    mysql.Update(sql)
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
    })
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});