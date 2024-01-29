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
    let sql = `INSERT INTO generate_payroll (gp_attendancedate, gp_employeeid, gp_datetimein, gp_datetimeout, gp_totalhours_numeric, gp_totalminutes_numeric, gp_late, gp_status)
    SELECT
        dates.date_value AS gp_attendancedate,
        e.me_id AS gp_employeeid,
        COALESCE(ma.ma_clockin, '0000-00-00 00:00:00') AS gp_datetimein,
        COALESCE(ma.ma_clockout, '0000-00-00 00:00:00') AS gp_datetimeout,
        COALESCE(HOUR(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)), 0) AS gp_totalhours_numeric,
        COALESCE(MINUTE(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)), 0) AS gp_totalminutes_numeric,
        IFNULL(
            CASE
                WHEN ma.ma_clockin = '0000-00-00 00:00:00' OR ma.ma_clockout = '0000-00-00 00:00:00' THEN 0
                WHEN HOUR(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)) >= 9 THEN 0
                ELSE (9 - HOUR(TIMEDIFF(ma.ma_clockout, ma.ma_clockin))) * 60 + MINUTE(TIMEDIFF(ma.ma_clockout, ma.ma_clockin))
            END,
            0
        ) AS gp_late,
     IFNULL(
            CASE
                WHEN ma.ma_clockin = '0000-00-00 00:00:00' AND ma.ma_clockout = '0000-00-00 00:00:00' THEN 0.00
                WHEN COALESCE(HOUR(TIMEDIFF(COALESCE(ma.ma_clockout, '0000-00-00 00:00:00'), COALESCE(ma.ma_clockin, '0000-00-00 00:00:00'))), 0) >= 9 THEN 1
                WHEN COALESCE(HOUR(TIMEDIFF(COALESCE(ma.ma_clockout, '0000-00-00 00:00:00'), COALESCE(ma.ma_clockin, '0000-00-00 00:00:00'))), 0) < 9 
            AND COALESCE(HOUR(TIMEDIFF(COALESCE(ma.ma_clockout, '0000-00-00 00:00:00'), COALESCE(ma.ma_clockin, '0000-00-00 00:00:00'))), 0) > 9 THEN 0.5
          WHEN (9 - HOUR(TIMEDIFF(ma.ma_clockout, ma.ma_clockin))) * 60 + MINUTE(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)) >= 60 THEN 0.5
                WHEN COALESCE(MINUTE(TIMEDIFF(ma.ma_clockout, ma.ma_clockin)), 0) = 5 THEN 0.5
                ELSE 0
            END,
            0
        ) AS gp_status
    FROM
        (
            SELECT '${startdate}' + INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY AS date_value
            FROM
                (SELECT 0 AS a UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
                (SELECT 0 AS a UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b,
                (SELECT 0 AS a UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c
        ) dates
    CROSS JOIN
        (SELECT DISTINCT me_id FROM master_employee) e
    LEFT JOIN
        master_attendance ma ON dates.date_value = ma.ma_attendancedate AND e.me_id = ma.ma_employeeid
    WHERE
        dates.date_value BETWEEN '${startdate}' AND '${enddate}'
    ORDER BY gp_attendancedate DESC;
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







// router.post('generatepayroll', (req, res) => {
//   try {
//     let 
//     let sql = `UPDATE salary SET s_totalhours = ? WHERE s_employeeid = ?`;

//     mysql.mysqlQueryPromise(sql)
//     .then((result) => {
//       res.json({
//         msg:'success',
//         data: result,
//       });
//     })
//     .catch((error) => {
//       res.json({
//         msg:'error',
//         data: error,
//       });
//     })
//   } catch (error) {
//     res.json({
//       msg:'error',
//       data: error,
//     });
//   }
// });





// router.post('/generate_salaries', async (req, res) => {
//   try {
//     const startDate = req.body.startDate; 
//     const endDate = req.body.endDate;

//     const employees = await getEmployees(startDate, endDate);

//     // Fetch and calculate salary details for each employee
//     const salaries = await Promise.all(
//       employees.map(async employee => {
//         const attendanceData = await getAttendanceData(employee.me_id, startDate, endDate);
//         const allowanceData = await getAllowanceData(employee.me_id);

//         const totalHours = calculateTotalHours(attendanceData);
//         const totalSalary = calculateTotalSalary(allowanceData);

//         await insertSalaryDetails(
//           employee.me_id, allowanceData[0].ms_id, 'your_cutoff_value', totalSalary,
//           totalHours, 'your_total_deductions_value', 'your_payroll_date_value',
//           allowanceData[0].ms_allowances, 'your_adjustment_value',
//           'your_spholiday_value', 'your_restdayout_value', 'your_legalholiday_value'
//         );

//         return {
//           employee_id: employee.me_id,
//           employee_name: `${employee.me_firstname} ${employee.me_lastname}`,
//           total_hours: totalHours,
//           total_salary: totalSalary
//         };
//       })
//     );

//     res.status(200).json({ salaries });
//   } catch (error) {
//     console.error('Error generating salaries:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// function insertSalaryDetails(employeeId, msSalaryId, cutoff, netPay, totalHours, totalDeductions, payRollDate, allowances, adjustment, spHoliday, restDayOT, legalHoliday) {
//   return new Promise((resolve, reject) => {
//     let sql = `
//       INSERT INTO salary (
//         s_employeeid, s_mssalaryid, s_cutoff, s_netpay, s_totalhours, s_totaldeductions, 
//         s_payrolldate, s_allowances, s_adjustment, s_spholiday, s_restdayot, s_legalholiday
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//     mysql.Insert(
//       sql,
//       [
//         employeeId, msSalaryId, cutoff, netPay, totalHours, totalDeductions,
//         payRollDate, allowances, adjustment, spHoliday, restDayOT, legalHoliday
//       ],
//       (err, result) => {
//         if (err) {
//           console.error("Error inserting salary details:", err);
//           reject(err);
//         } else {
//           resolve(result);
//         }
//       }
//     );
//   });
// }

// function getEmployees(startDate, endDate) {
//   return new Promise((resolve, reject) => {
//     let sql = `
//       SELECT * FROM master_employee
//       WHERE me_jobstatus IN ('regular', 'probationary')`;

//     mysql.Select(sql, "Master_Employee", (err, result) => {
//       if (err) {
//         console.error("Error fetching employees:", err);
//         reject(err);
//       } else {
//         resolve(result);
//       }
//     });
//   });
// }

// function getAttendanceData(employeeId, startDate, endDate) {
//   return new Promise((resolve, reject) => {
//     let sql = `
//       SELECT * FROM master_attendance
//       WHERE ma_employeeid = ? AND ma_attendancedate BETWEEN ? AND ?`;

//     mysql.Select(sql, [employeeId, startDate, endDate], (err, result) => {
//       if (err) {
//         console.error("Error fetching attendance data:", err);
//         reject(err);
//       } else {
//         resolve(result);
//       }
//     });
//   });
// }

// function getAllowanceData(employeeId) {
//   return new Promise((resolve, reject) => {
//     let sql = `
//       SELECT ms_id, ms_allowances FROM master_salary
//       WHERE ms_employeeid = ?`;

//     mysql.Select(sql, [employeeId], (err, result) => {
//       if (err) {
//         console.error("Error fetching allowance data:", err);
//         reject(err);
//       } else {
//         resolve(result);
//       }
//     });
//   });
// }

// function calculateTotalHours(attendanceData) {
//   let totalHours = 0;
//   attendanceData.forEach(row => {
//     if (row.ma_clockin && row.ma_clockout) {
//       const clockin = new Date(row.ma_clockin);
//       const clockout = new Date(row.ma_clockout);

//       const secondsDiff = Math.abs(Math.floor((clockout - clockin) / 1000));
//       const hours = Math.floor(secondsDiff / 3600);
//       const minutes = Math.floor((secondsDiff % 3600) / 60);
//       const formattedHours = `${hours}h ${minutes}m`;

//       totalHours += formattedHours;
//     }
//   });
//   return totalHours;
// }

// function calculateTotalSalary(allowanceData) {
//   if (allowanceData.length > 0) {
//     const monthlySalary = allowanceData[0].ms_allowances || 0;
//     const allowances = allowanceData[0].ms_allowances || 0;
//     return monthlySalary + allowances;
//   }
//   return 0;
// }
