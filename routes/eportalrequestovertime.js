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
const { DataModeling } = require("./model/hrmisdb");
const e = require("express");
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

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

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

router.get("/loadapproved", (req, res) => {
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
      DATE_FORMAT(pao_payroll_date, '%W, %Y-%m-%d') AS pao_payroll_date,
      pao_status
      FROM payroll_approval_ot
      WHERE pao_employeeid = '${employeeid}'
      AND pao_status = 'Approved'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

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

router.get("/loadapplied", (req, res) => {
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
        DATE_FORMAT(pao_payroll_date, '%W, %Y-%m-%d') AS pao_payroll_date,
        pao_status
        FROM payroll_approval_ot
        WHERE pao_employeeid = '${employeeid}'
        AND pao_status = 'Applied'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

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

router.get("/loadrejected", (req, res) => {
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
        DATE_FORMAT(pao_payroll_date, '%W, %Y-%m-%d') AS pao_payroll_date,
        pao_status
        FROM payroll_approval_ot
        WHERE pao_employeeid = '${employeeid}'
        AND pao_status = 'Rejected'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

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

router.get("/loadcancelled", (req, res) => {
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
        DATE_FORMAT(pao_payroll_date, '%W, %Y-%m-%d') AS pao_payroll_date,
        pao_status
        FROM payroll_approval_ot
        WHERE pao_employeeid = '${employeeid}'
        AND pao_status = 'Cancel'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

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
    DATE_FORMAT(pao_payroll_date, '%Y-%m-%d') AS payrolldate,
    pao_status AS status,
    pao_night_hours_pay as nightotpay,
    pao_normal_ot_pay as normalotpay,
    pao_early_ot_pay as earlyotpay,
    pao_total_ot_net_pay as totalotpay,
    pao_reason AS reason,
    pao_overtimeimage as overtimeimage
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
    let reason = req.body.reason;
    let overtimestatus = req.body.overtimestatus;
    let subgroup = req.body.subgroup;
    let approvecount = 0;
    let overtimeimage = req.body.overtimeimage;

    console.log(clockin, "clockin");
    console.log(clockout, "clockout");
    console.log(attendancedate, "attendancedate");
    console.log(payrolldate, "payrolldate");
    console.log(reason, "reason");
    console.log(overtimestatus, "overtimestatus");
    console.log(subgroup, "subgroup");
    console.log(approvecount, "approvecount");
    console.log(employeeid, "employeeid");

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
    pao_minutes_ot,
    pao_night_minutes_ot,
    pao_night_pay,
    pao_total_night_min_ot,
    pao_normal_pay,
    pao_total_min_ot,
    pao_night_hours_pay,
    pao_night_minutes_pay,
    pao_normal_ot_pay,
    pao_normal_ot_minutes_pay,
    pao_early_ot_pay,
    pao_total_ot_net_pay,
    pao_payroll_date,
    pao_reason,
    pao_status,
    pao_subgroupid,
    pao_approvalcount,
    pao_overtimeimage
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
    COALESCE(
    CASE
        WHEN DAYOFWEEK('${attendancedate}') = 2 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 3 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 4 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 5 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 6 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 7 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 1 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
            END
        ELSE 0
    END, 0
) AS pao_minutes_ot,
    COALESCE(
    CASE 
        WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME) 
        THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
        ELSE 0 
    END, 0
) AS pao_night_minutes_ot,
ROUND(COALESCE(
CASE 
    WHEN s.ms_payrolltype = 'Daily' 
    THEN s.ms_monthly / 8 * 1.25 * 1.10
    ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10 
END, 0), 2) * LEAST(
CASE
    WHEN (('${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)) 
        AND (CAST(CONCAT(DATE('${clockout}'), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE('${clockout}'), ' ', '06:00:00') AS DATETIME))
    THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))), 0)
    ELSE 0
END,
8
) + (ROUND(COALESCE(
CASE 
    WHEN s.ms_payrolltype = 'Daily' 
    THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
    ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60 
END, 0), 2) * COALESCE(
CASE 
    WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME) 
    THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
    ELSE 0 
END, 0)
) AS pao_night_pay,
ROUND(COALESCE(
    CASE 
        WHEN s.ms_payrolltype = 'Daily' 
        THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
        ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60 
    END, 0), 2) * COALESCE(
    CASE 
        WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME) 
        THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
        ELSE 0 
    END, 0
)AS pao_total_night_min_ot,
ROUND(COALESCE(
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
END) + (ROUND(COALESCE(
    CASE 
        WHEN s.ms_payrolltype = 'Daily' 
        THEN s.ms_monthly / 8 * 1.25 / 60
        ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
    END, 0), 2) * (COALESCE(
    CASE
        WHEN DAYOFWEEK('${attendancedate}') = 2 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 3 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 4 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 5 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 6 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 7 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 1 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
            END
        ELSE 0
    END, 0
    )))AS pao_normal_pay,
    ROUND(COALESCE(
    CASE 
        WHEN s.ms_payrolltype = 'Daily' 
        THEN s.ms_monthly / 8 * 1.25 / 60
        ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
    END, 0), 2) * (COALESCE(
    CASE
        WHEN DAYOFWEEK('${attendancedate}') = 2 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 3 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 4 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 5 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 6 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 7 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 1 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
            END
        ELSE 0
    END, 0
))
    AS pao_total_min_ot,
ROUND(COALESCE(
    CASE 
        WHEN s.ms_payrolltype = 'Daily' 
        THEN s.ms_monthly / 8 * 1.25 * 1.10
        ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10 
    END, 0), 2) AS pao_night_hours_pay,
ROUND(COALESCE(
    CASE 
        WHEN s.ms_payrolltype = 'Daily' 
        THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
        ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60 
    END, 0), 2) AS pao_night_minutes_pay,
ROUND(COALESCE(
    CASE 
        WHEN s.ms_payrolltype = 'Daily' 
        THEN s.ms_monthly / 8 * 1.25
        ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
    END, 0), 2) AS pao_normal_ot_pay,
        ROUND(COALESCE(
    CASE 
        WHEN s.ms_payrolltype = 'Daily' 
        THEN s.ms_monthly / 8 * 1.25 / 60
        ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
    END, 0), 2) AS pao_normal_ot_minutes_pay,
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
)) + (ROUND(COALESCE(
    CASE 
        WHEN s.ms_payrolltype = 'Daily' 
        THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
        ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60 
    END, 0), 2) * COALESCE(
    CASE 
        WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME) 
        THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
        ELSE 0 
    END, 0
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
END)) + (ROUND(COALESCE(
    CASE 
        WHEN s.ms_payrolltype = 'Daily' 
        THEN s.ms_monthly / 8 * 1.25 / 60
        ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
    END, 0), 2) * (COALESCE(
    CASE
        WHEN DAYOFWEEK('${attendancedate}') = 2 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 3 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 4 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 5 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 6 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 7 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
            END
        WHEN DAYOFWEEK('${attendancedate}') = 1 THEN 
            CASE 
                WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME) 
                THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
                ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
            END
        ELSE 0
    END, 0
    )))) AS pao_total_ot_net_pay,
'${payrolldate}' AS pao_payroll_date,
'${reason}' AS pao_reason,
'${overtimestatus}' AS pao_status,
'${subgroup}' AS pao_subgroupid,
'${approvecount}' AS pao_approvalcount,
'${overtimeimage}' AS pao_overtimeimage
FROM master_salary s
INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
    WHERE me_id = '${employeeid}'
    LIMIT 1`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      } else {
        res.json(JsonDataResponse(result));
      }
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
    console.log("hit");

    let approveot_id = req.body.approveot_id;
    let clockin = req.body.clockin;
    let clockout = req.body.clockout;
    let attendancedate = req.body.attendancedate;
    let payrolldate = req.body.payrolldate;
    let employeeid = req.body.employeeid;
    let overtimestatus = req.body.overtimestatus;
    let reason = req.body.reason;
    let subgroup = req.body.subgroup;
    let overtimeimage = req.body.overtimeimage;

    let sql = `UPDATE payroll_approval_ot
    SET 
        pao_image = (
            SELECT me.me_profile_pic
            FROM master_employee me
            WHERE me.me_id = '${employeeid}'
            LIMIT 1
        ),
        pao_fullname = CONCAT(
            (
                SELECT me.me_lastname
                FROM master_employee me
                WHERE me.me_id = '${employeeid}'
                LIMIT 1
            ),
            ' ',
            (
                SELECT me.me_firstname
                FROM master_employee me
                WHERE me.me_id = '${employeeid}'
                LIMIT 1
            )
        ),
        pao_employeeid = '${employeeid}',
        pao_attendancedate = '${attendancedate}',
        pao_clockin = '${clockin}',
        pao_clockout = '${clockout}',
        pao_total_hours = COALESCE(HOUR(TIMEDIFF('${clockout}', '${clockin}')), 0),
        pao_night_differentials = LEAST(
            CASE
                WHEN (('${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)) 
                    AND (CAST(CONCAT(DATE('${clockout}'), ' ', '00:00:00') AS DATETIME)) <= CAST(CONCAT(DATE('${clockout}'), ' ', '06:00:00') AS DATETIME))
                THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))))
                ELSE 0
            END,
            8
        ),
        pao_early_ot =  ( SELECT CASE
                        WHEN '${clockin}' <= CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
                        THEN COALESCE(HOUR(TIMEDIFF('${clockin}', CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME))))
                        ELSE 0
                    END FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),
        pao_normal_ot =  (SELECT CASE
					WHEN '${clockout}' <= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME) 
						AND '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
					THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
					WHEN '${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)
					THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
					ELSE 0
				END FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),
	  pao_minutes_ot =  (SELECT COALESCE(
					CASE
						WHEN DAYOFWEEK('${attendancedate}') = 2 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 3 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 4 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 5 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 6 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 7 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 1 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
							END
						ELSE 0
					END, 0
				) FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),
	  pao_night_minutes_ot =  (SELECT COALESCE(
					CASE 
						WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME) 
						THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
						ELSE 0 
					END, 0
				) FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),
      pao_night_pay = (SELECT ROUND(COALESCE(
				CASE 
					WHEN s.ms_payrolltype = 'Daily' 
					THEN s.ms_monthly / 8 * 1.25 * 1.10
					ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10 
				END, 0), 2) * LEAST(
				CASE
					WHEN (('${clockout}' >= CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME)) 
						AND (CAST(CONCAT(DATE('${clockout}'), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE('${clockout}'), ' ', '06:00:00') AS DATETIME))
					THEN COALESCE(HOUR(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME))), 0)
					ELSE 0
				END,
				8
			) + (ROUND(COALESCE(
				CASE 
					WHEN s.ms_payrolltype = 'Daily' 
					THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
					ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60 
				END, 0), 2) * COALESCE(
				CASE 
					WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME) 
					THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
					ELSE 0 
				END, 0)
			) FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),
		pao_total_night_min_ot =  (SELECT ROUND(COALESCE(
                    CASE 
                        WHEN s.ms_payrolltype = 'Daily' 
                        THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
                        ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60 
                    END, 0), 2) * COALESCE(
					CASE 
						WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME) 
						THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
						ELSE 0 
					END, 0
				)
				END FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),
        pao_normal_pay = (SELECT ROUND(COALESCE(
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
                END) + (ROUND(COALESCE(
                    CASE 
                        WHEN s.ms_payrolltype = 'Daily' 
                        THEN s.ms_monthly / 8 * 1.25 / 60
                        ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
                    END, 0), 2) * (COALESCE(
					CASE
						WHEN DAYOFWEEK('${attendancedate}') = 2 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 3 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 4 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 5 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 6 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 7 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 1 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
							END
						ELSE 0
					END, 0
				  ))) FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),
	pao_total_min_ot =  (SELECT ROUND(COALESCE(
                    CASE 
                        WHEN s.ms_payrolltype = 'Daily' 
                        THEN s.ms_monthly / 8 * 1.25 / 60
                        ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
                    END, 0), 2) * (COALESCE(
					CASE
						WHEN DAYOFWEEK('${attendancedate}') = 2 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 3 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 4 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 5 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 6 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 7 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 1 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
							END
						ELSE 0
					END, 0
				)) FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),
      pao_night_hours_pay = (SELECT ROUND(COALESCE(
                    CASE 
                        WHEN s.ms_payrolltype = 'Daily' 
                        THEN s.ms_monthly / 8 * 1.25 * 1.10
                        ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 * 1.10 
                    END, 0), 2) 
                        FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),
	  pao_night_minutes_pay =  (SELECT ROUND(COALESCE(
                    CASE 
                        WHEN s.ms_payrolltype = 'Daily' 
                        THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
                        ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60 
                    END, 0), 2)
				END FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),
      pao_normal_ot_pay = ( SELECT ROUND(COALESCE(
                    CASE 
                        WHEN s.ms_payrolltype = 'Daily' 
                        THEN s.ms_monthly / 8 * 1.25
                        ELSE s.ms_monthly / 313 * 12 / 8  * 1.25
                    END, 0), 2)
                        FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),
	  pao_normal_ot_minutes_pay = ( SELECT ROUND(COALESCE(
                    CASE 
                        WHEN s.ms_payrolltype = 'Daily' 
                        THEN s.ms_monthly / 8 * 1.25 / 60
                        ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
                    END, 0), 2)
                        FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),
      pao_early_ot_pay = (SELECT ROUND(
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
                ) FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),
      pao_total_ot_net_pay =  (SELECT ((ROUND(COALESCE(
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
                )) + (ROUND(COALESCE(
                    CASE 
                        WHEN s.ms_payrolltype = 'Daily' 
                        THEN s.ms_monthly / 8 * 1.25 * 1.10 / 60
                        ELSE s.ms_monthly / 313 * 12 / 8 * 1.25 * 1.10 / 60 
                    END, 0), 2) * COALESCE(
					CASE 
						WHEN '${clockout}' > CAST(CONCAT(DATE('${attendancedate}'), ' 22:00:00') AS DATETIME) 
						THEN MINUTE(TIMEDIFF('${clockout}', CONCAT(DATE('${attendancedate}'), ' 22:00:00')))
						ELSE 0 
					END, 0
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
                END)) + (ROUND(COALESCE(
                    CASE 
                        WHEN s.ms_payrolltype = 'Daily' 
                        THEN s.ms_monthly / 8 * 1.25 / 60
                        ELSE s.ms_monthly / 313 * 12 / 8  * 1.25 / 60
                    END, 0), 2) * (COALESCE(
					CASE
						WHEN DAYOFWEEK('${attendancedate}') = 2 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_monday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 3 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_tuesday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 4 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_wednesday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 5 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_thursday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 6 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_friday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 7 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_saturday, '$.time_out'))) AS DATETIME)))
							END
						WHEN DAYOFWEEK('${attendancedate}') = 1 THEN 
							CASE 
								WHEN '${clockout}' > CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME) 
								THEN MINUTE(TIMEDIFF(CAST(CONCAT('${attendancedate}', ' ', '22:00:00') AS DATETIME), CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
								ELSE MINUTE(TIMEDIFF('${clockout}', CAST(CONCAT('${attendancedate}', ' ', JSON_UNQUOTE(JSON_EXTRACT(ms.ms_sunday, '$.time_out'))) AS DATETIME)))
							END
						ELSE 0
					END, 0
				  )))) FROM master_salary s
                INNER JOIN master_shift ms ON s.ms_employeeid = ms.ms_employeeid
                INNER JOIN master_attendance ma ON s.ms_employeeid = ma.ma_employeeid
                INNER JOIN master_employee me ON s.ms_employeeid = me.me_id
                WHERE me_id = '${employeeid}'
                LIMIT 1),        
        pao_payroll_date = '${payrolldate}',
        pao_reason = '${reason}',
        pao_status = '${overtimestatus}',
        pao_subgroupid = '${subgroup}',
        pao_overtimeimage = '${overtimeimage}'
    WHERE pao_id = '${approveot_id}'`;

    console.log(clockin);
    console.log(clockout);
    console.log(attendancedate);
    console.log(payrolldate);
    console.log(reason);
    console.log(overtimestatus);
    console.log(approveot_id);
    console.log(subgroup);

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

router.post("/getattendancedate", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let attendancedate = req.body.attendancedate;

    console.log(employeeid);
    console.log(attendancedate);
    let sql = `SELECT
    ma_attendanceid as pao_attendanceid,
    CASE 
        WHEN mh_date IS NOT NULL THEN mh_type
        WHEN (
            JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Monday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Tuesday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Wednesday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Thursday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Friday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Saturday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Sunday'
        )
        THEN 'Rest Day'
        ELSE TIME_FORMAT(
            JSON_UNQUOTE(JSON_EXTRACT(
                CASE DAYNAME(ma_attendancedate)
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
    END AS pao_starttime,
    CASE 
        WHEN mh_date IS NOT NULL THEN mh_type
        WHEN (
            JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Monday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Tuesday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Wednesday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Thursday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Friday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Saturday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Sunday'
        )
        THEN 'Rest Day'
        ELSE TIME_FORMAT(
            JSON_UNQUOTE(JSON_EXTRACT(
                CASE DAYNAME(ma_attendancedate)
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
    END AS pao_endtime,
    JSON_UNQUOTE(JSON_EXTRACT(
        CASE DAYNAME(ma_attendancedate)
            WHEN 'Monday' THEN ms_monday
            WHEN 'Tuesday' THEN ms_tuesday
            WHEN 'Wednesday' THEN ms_wednesday
            WHEN 'Thursday' THEN ms_thursday
            WHEN 'Friday' THEN ms_friday
            WHEN 'Saturday' THEN ms_saturday
            WHEN 'Sunday' THEN ms_sunday
        END,
        '$.time_in'
    )) AS pao_schedtimein,
    JSON_UNQUOTE(JSON_EXTRACT(
        CASE DAYNAME(ma_attendancedate)
            WHEN 'Monday' THEN ms_monday
            WHEN 'Tuesday' THEN ms_tuesday
            WHEN 'Wednesday' THEN ms_wednesday
            WHEN 'Thursday' THEN ms_thursday
            WHEN 'Friday' THEN ms_friday
            WHEN 'Saturday' THEN ms_saturday
            WHEN 'Sunday' THEN ms_sunday
        END,
        '$.time_out'
    )) AS pao_schedtimeout,
    mp_positionname AS pao_positioname,
    md_departmentname AS pao_departmentname,
    concat(me_lastname,' ',me_firstname) AS pao_fullname
FROM master_attendance
INNER JOIN master_shift ON master_attendance.ma_employeeid = ms_employeeid
INNER JOIN master_employee ON master_shift.ms_employeeid = me_id
LEFT JOIN master_holiday ON ma_attendancedate = mh_date
INNER JOIN master_department ON master_employee.me_department = md_departmentid
INNER JOIN master_position ON master_employee.me_position = mp_positionid
WHERE me_id = '${employeeid}' AND 
 ma_attendancedate = '${attendancedate}'
LIMIT 1;
    `;

    Check(sql)
      .then((result) => {
        if (result.length === 0) {
          return res.json(JsonWarningResponse(MessageStatus.NOTEXIST));
        } else {
          Select(sql, (err, result) => {
            if (err) {
              console.error(err);
              res.json(JsonErrorResponse(err));
            }

            if (result != 0) {
              let data = DataModeling(result, "pao_");

              console.log(data);
              res.json(JsonDataResponse(data));
            } else {
              res.json(JsonDataResponse(result));
            }
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}
