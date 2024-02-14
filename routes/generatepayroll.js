const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
// const { Master_Geofence_Settings } = require('./model/hrmisdb');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('govermentidlayout', { title: 'Express' });
  Validator(req, res, 'generatepayrolllayout',);
});

module.exports = router;


router.post('/load', (req, res) =>{
  try {
    let sql = ``;

    mysql.Select(sql, "Salary", (err, result) => {
      if (err) console.error("Error :", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: 'error',
      data: error,
    });
  }
});

router.post('/generatepayroll', (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let sql = `INSERT INTO generate_payroll (
      gp_employeeid,
      gp_attendancedate,
      gp_clockin,
      gp_clockout,
      gp_timein_schedule,
      gp_timeout_schedule,
      gp_late,
      gp_overtime,
      gp_per_day,
      gp_per_hour,
      gp_total_hours,
      gp_night_differentials,
      gp_normal_ot,
      gp_early_ot,
      gp_nightdiff_pay_per_ot,
      gp_basic_pay_per_ot,
      gp_status,
      gp_total_nd_pay,
      gp_total_normal_ot_pay
  )
  SELECT
      employee_ids.ma_employeeid as gp_employeeid,
      date_range_table.date_range_date AS gp_attendancedate,
      COALESCE(ma.ma_clockin, '00:00:00') AS gp_clockin,
      COALESCE(ma.ma_clockout, '00:00:00') AS gp_clockout,
       COALESCE(
          CASE
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN TIME_FORMAT(ms.ms_MONDAY->>'$.time_in', '%H:%i:%s')
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN TIME_FORMAT(ms.ms_TUESDAY->>'$.time_in', '%H:%i:%s')
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN TIME_FORMAT(ms.ms_WEDNESDAY->>'$.time_in', '%H:%i:%s')
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN TIME_FORMAT(ms.ms_THURSDAY->>'$.time_in', '%H:%i:%s')
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN TIME_FORMAT(ms.ms_FRIDAY->>'$.time_in', '%H:%i:%s')
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN TIME_FORMAT(ms.ms_SATURDAY->>'$.time_in', '%H:%i:%s')
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN TIME_FORMAT(ms.ms_SUNDAY->>'$.time_in', '%H:%i:%s')
              ELSE NULL
          END,
          '00:00:00'
      ) AS gp_timein_schedule,
      COALESCE(
          CASE
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 2 THEN TIME_FORMAT(ms.ms_MONDAY->>'$.time_out', '%H:%i:%s')
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 3 THEN TIME_FORMAT(ms.ms_TUESDAY->>'$.time_out', '%H:%i:%s')
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 4 THEN TIME_FORMAT(ms.ms_WEDNESDAY->>'$.time_out', '%H:%i:%s')
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 5 THEN TIME_FORMAT(ms.ms_THURSDAY->>'$.time_out', '%H:%i:%s')
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 6 THEN TIME_FORMAT(ms.ms_FRIDAY->>'$.time_out', '%H:%i:%s')
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 7 THEN TIME_FORMAT(ms.ms_SATURDAY->>'$.time_out', '%H:%i:%s')
              WHEN DAYOFWEEK(date_range_table.date_range_date) = 1 THEN TIME_FORMAT(ms.ms_SUNDAY->>'$.time_out', '%H:%i:%s')
              ELSE NULL
          END,
          '00:00:00'
      ) AS gp_timeout_schedule,
      IFNULL(
          TIMEDIFF(ma.ma_clockin, CONCAT(ma.ma_attendancedate, ' ', ms.ms_MONDAY->>'$.time_in')),
          '00:00:00'
      ) AS gp_late,
     IFNULL(
      GREATEST(
          TIMEDIFF(
              ma.ma_clockout,
              CONCAT(ma.ma_attendancedate, ' ', COALESCE(ms.ms_MONDAY->>'$.time_out', '00:00:00'))
          ),
          '00:00:00'
      ),
      '00:00:00'
  ) AS gp_overtime,
      COALESCE(s.ms_monthly / 2 / 13 , 0) AS gp_per_day,
      COALESCE(s.ms_monthly / 2 / 13 / 8, 0) AS gp_per_hour,
      COALESCE(HOUR(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)), 0) AS gp_total_hours,
      LEAST(
          CASE
              WHEN ((ma.ma_clockout >= CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME)) 
                  AND (CAST(CONCAT(DATE(ma_clockout), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE(ma_clockout), ' ', '06:00:00') AS DATETIME))
                  THEN COALESCE(HOUR( TIMEDIFF(ma.ma_clockout,CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME))))
              ELSE
                  0
          END,
          8
      ) AS gp_night_differentials,
      CASE
          WHEN ma.ma_clockout <= CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME) AND ma_clockout >= CAST(CONCAT(ma_attendancedate, ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
              THEN COALESCE(HOUR(TIMEDIFF(ma.ma_clockout,CAST(CONCAT(ma_attendancedate, ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
          WHEN ma.ma_clockout >= CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME)
              THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME),CAST(CONCAT(ma_attendancedate, ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
          ELSE
              0
      END AS gp_normal_ot,
      CASE
          WHEN ma.ma_clockin <= CAST(CONCAT(ma_attendancedate, ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME)
              THEN COALESCE(HOUR(TIMEDIFF(ma.ma_clockin,CAST(CONCAT(ma_attendancedate, ' ', ms.ms_MONDAY->>'$.time_in') AS DATETIME))))
          ELSE
              0
      END AS gp_early_ot,
      ROUND(COALESCE(s.ms_monthly / 2 / 13 / 8 * 1.25 * 1.10, 0), 2) AS gp_nightdiff_pay_per_ot,
      ROUND(COALESCE(s.ms_monthly / 2 / 13 / 8 * 1.25, 0), 2) AS gp_basic_pay_per_ot,
     CASE
      WHEN COALESCE(HOUR(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)), 0) = 0 THEN 0  -- Set status to 0 if total hours is 0
      ELSE
          IFNULL(
              CASE
                  WHEN ma.ma_clockin = ms.ms_MONDAY->>'$.time_in' AND ma.ma_clockout = ms.ms_MONDAY->>'$.time_out' THEN 0.00
                  WHEN COALESCE(HOUR(TIMEDIFF(COALESCE(ma.ma_clockout,ms.ms_MONDAY->>'$.time_out'), COALESCE(ma.ma_clockin, ms.ms_MONDAY->>'$.time_in'))), 0) >= 9 THEN 1
                  WHEN COALESCE(HOUR(TIMEDIFF(COALESCE(ma.ma_clockout,ms.ms_MONDAY->>'$.time_out'), COALESCE(ma.ma_clockin, ms.ms_MONDAY->>'$.time_in'))), 0) < 9 
                      AND COALESCE(HOUR(TIMEDIFF(COALESCE(ma.ma_clockout,ms.ms_MONDAY->>'$.time_out'), COALESCE(ma.ma_clockin, ms.ms_MONDAY->>'$.time_in'))), 0) >= 4 THEN 0.5
                  WHEN (9 - HOUR(TIMEDIFF(ma.ma_clockout, ma.ma_clockin))) * 60 + MINUTE(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)) >= 60 THEN 0.5
                  WHEN COALESCE(MINUTE(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)), 0) >= 5 THEN 0.5
                  ELSE 0
              END,
              CASE
                  WHEN COALESCE(HOUR(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)), 0) = 0 THEN 0  -- Set status to 0 if total hours is 0
                  ELSE 0
              END
          )
  END AS gp_status,
      ROUND(
          COALESCE(s.ms_monthly / 2 / 13 / 8 * 1.25 * 1.10, 0) * LEAST(
              CASE
                  WHEN ((ma.ma_clockout >= CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME)) 
                      AND (CAST(CONCAT(DATE(ma_clockout), ' ', '00:00:00') AS DATETIME)) <=  CAST(CONCAT(DATE(ma_clockout), ' ', '06:00:00') AS DATETIME))
                      THEN COALESCE(HOUR( TIMEDIFF(ma.ma_clockout,CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME))))
                  ELSE
                      0
              END,
              8
          ),
          2
      ) AS gp_total_nd_pay,
      ROUND(
          COALESCE(s.ms_monthly / 2 / 13 / 8 * 1.25, 0) * CASE
              WHEN ma.ma_clockout <= CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME) AND ma_clockout >= CAST(CONCAT(ma_attendancedate, ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME)
                  THEN COALESCE(HOUR(TIMEDIFF(ma.ma_clockout,CAST(CONCAT(ma_attendancedate, ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
              WHEN ma.ma_clockout >= CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME)
                  THEN COALESCE(HOUR(TIMEDIFF(CAST(CONCAT(ma_attendancedate, ' ', '22:00:00') AS DATETIME),CAST(CONCAT(ma_attendancedate, ' ', ms.ms_MONDAY->>'$.time_out') AS DATETIME))))
              ELSE
                  0
          END,
          2
      ) AS gp_total_normal_ot_pay
  FROM (
      SELECT DATE_ADD('${startdate}', INTERVAL (t4.i*10000 + t3.i*1000 + t2.i*100 + t1.i*10 + t0.i) DAY) AS date_range_date
      FROM 
          (SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS t0,
          (SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS t1,
          (SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS t2,
          (SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS t3,
          (SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS t4
      WHERE 
          DATE_ADD('${startdate}', INTERVAL (t4.i*10000 + t3.i*1000 + t2.i*100 + t1.i*10 + t0.i) DAY) BETWEEN '${startdate}' AND '${enddate}'
  ) AS date_range_table
  CROSS JOIN (
      SELECT DISTINCT me_id AS ma_employeeid FROM master_employee
  ) AS employee_ids
  LEFT JOIN master_attendance ma ON date_range_table.date_range_date = ma.ma_attendancedate AND employee_ids.ma_employeeid = ma.ma_employeeid
  JOIN master_employee me ON employee_ids.ma_employeeid = me.me_id
  JOIN master_shift ms ON me.me_id = ms.ms_employeeid
  LEFT JOIN master_salary s ON me.me_id = s.ms_employeeid
  ORDER BY ma_attendancedate DESC;
  `;

    mysql.mysqlQueryPromise(sql)
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
    })
  } catch (error) {
    res.json({ 
      msg: 'error',
      data: error,
    });
  }
});


router.post('/loadpayroll', (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let sql = `SELECT
    '${startdate}' AS start_date,
    '${enddate}' AS end_date,
    gp.gp_employeeid,
    SUM(COALESCE(gd.gd_amount, 0)) AS total_deductions,
    (SUM(gp.gp_per_day) - SUM(COALESCE(gd.gd_amount, 0))) AS total_net_pay
FROM
    generate_payroll gp
LEFT JOIN
    government_deductions gd ON gp.gp_employeeid = gd.gd_employeeid
    AND gp.gp_attendancedate BETWEEN @start_date AND @end_date
GROUP BY
    gp.gp_employeeid
ORDER BY
    gp.gp_employeeid ASC`;

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      res.json({
        msg:'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg:"error",
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


router.post('/viewpayslip', (req,res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let employeeid = req.body.employeeid;
    let sql = ``;

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
    })
  }
});






