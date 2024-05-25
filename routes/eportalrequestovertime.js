const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalrequestovertimelayout', { title: 'Express' });
  Validator(req, res, "eportalrequestovertimelayout", "eportalrequestovertime");
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

router.post("/getovertime", (req, res) => {
  try {
    let approveot_id = req.body.approveot_id;
    let sql = `SELECT
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
    pao_night_hours_pay as nightotpay,
    pao_normal_ot_pay as normalotpay,
    pao_early_ot_pay as earlyotpay,
    pao_total_ot_net_pay as totalotpay,
    pao_reason AS reason
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

router.post("/addrequstot", (req, res) => {
  try {
    let clockin = req.body.clockin;
    let clockout = req.body.clockout;
    let attendancedate = req.body.attendancedate;
    let employeeid = req.body.employeeid;
    let payrolldate = req.body.payrolldate;
    let sql = `
    INSERT INTO payroll_approval_ot (
      pao_image,
      pao_fullname,
      pao_employeeid,
      pao_attendancedate,
      pao_clockin,
      pao_clockout,
      pao_total_hours,
      pao_night_differentials,
      pao_early_ot,
      pao_normal_ot,
      pao_night_pay,
      pao_normal_pay,
      pao_night_hours_pay,
      pao_normal_ot_pay,
      pao_early_ot_pay,
      pao_total_ot_net_pay,
      pao_payroll_date,
      pao_status
  )
     SELECT
        me.me_profile_pic AS pao_image,
        CONCAT(me.me_lastname, ' ', me.me_firstname) AS pao_fullname,
        me.me_id AS pao_employeeid,
        '${attendancedate}' AS pao_attendancedate,
        '${clockin}' AS pao_clockin,
        '${clockout}' AS pao_clockout,
        COALESCE(HOUR(TIMEDIFF('${clockout}', '${clockin}')), 0) AS pao_total_hours,
        LEAST(
            CASE
                WHEN (('${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)) 
                    AND (CAST(CONCAT(DATE('${clockout}'), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE('${clockout}'), ' ', '06:00:00') AS DATETIME))
                THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))))
                ELSE 0
            END,
            8
        ) AS pao_night_differentials,
        CASE
            WHEN '${clockin}' <= CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
            THEN COALESCE(HOUR(TIMEDIFF('${clockin}', CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME))))
            ELSE 0
        END AS pao_early_ot,
        CASE
            WHEN '${clockout}' <= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) 
                AND '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
            THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
            WHEN '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
            THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
            ELSE 0
        END AS pao_normal_ot,
        ROUND(COALESCE(
            CASE 
                WHEN s.ms_payrolltype = 'Daily' 
                THEN s.ms_monthly / 8 * 1.25 * 1.10
                ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10 
            END, 0), 2) * LEAST(
            CASE
                WHEN (('${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)) 
                    AND (CAST(CONCAT(DATE('${clockout}'), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE('${clockout}'), ' ', '06:00:00') AS DATETIME))
                THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))))
                ELSE 0
            END,
            8
        ) AS pao_night_pay,
        ROUND(COALESCE(
            CASE 
                WHEN s.ms_payrolltype = 'Daily' 
                THEN s.ms_monthly / 8 * 1.25 
                ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 
            END, 0), 2) * CASE
            WHEN '${clockout}' <= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) 
                AND '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
            THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
            WHEN '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
            THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
            ELSE 0
        END AS pao_normal_pay,
        ROUND(COALESCE(
            CASE 
                WHEN s.ms_payrolltype = 'Daily' 
                THEN s.ms_monthly / 8 * 1.25 * 1.10
                ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10 
            END, 0), 2) AS pao_night_hours_pay,
        ROUND(COALESCE(
            CASE 
                WHEN s.ms_payrolltype = 'Daily' 
                THEN s.ms_monthly / 8 * 1.25 
                ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 
            END, 0), 2) AS pao_normal_ot_pay,
        ROUND(
            COALESCE(
                CASE
                    WHEN s.ms_payrolltype = 'Daily' 
                    THEN s.ms_monthly / 8 * 1.25 
                    ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 
                END, 0
            ) * 
            CASE
                WHEN '${clockin}' <= CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
                THEN COALESCE(HOUR(TIMEDIFF('${clockin}', CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME))), 0)
                ELSE 0
            END, 2
        ) AS pao_early_ot_pay,
        ((ROUND(COALESCE(
            CASE 
                WHEN s.ms_payrolltype = 'Daily' 
                THEN s.ms_monthly / 8 * 1.25 * 1.10
                ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10 
            END, 0), 2) * LEAST(
            CASE
                WHEN (('${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)) 
                    AND (CAST(CONCAT(DATE('${clockout}'), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE('${clockout}'), ' ', '06:00:00') AS DATETIME))
                THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))))
                ELSE 0
            END,
            8
        )) + 
        (ROUND(COALESCE(
            CASE 
                WHEN s.ms_payrolltype = 'Daily' 
                THEN s.ms_monthly / 8 * 1.25 
                ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 
            END, 0), 2) * (CASE
            WHEN '${clockout}' <= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) 
                AND '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
            THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
            WHEN '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
            THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
            ELSE 0
        END)) +
        (ROUND(COALESCE(
            CASE 
                WHEN s.ms_payrolltype = 'Daily' 
                THEN s.ms_monthly / 8 * 1.25 
                ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 
            END, 0), 2) * (CASE
            WHEN '${clockin}' <= CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
            THEN COALESCE(HOUR(TIMEDIFF('${clockin}', CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME))), 0)
            ELSE
                0
        END))) AS pao_total_ot_net_pay,
          '${payrolldate}' AS pao_payroll_date,
        'Pending' AS pao_status
    FROM master_salary s
    INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
    INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
    INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
    WHERE me_id = '${employeeid}'
    LIMIT 1`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        console.log(result, "result");
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

router.post("/update", (req, res) => {
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

    mysql
      .Update(sql)
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
