const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
const { Master_Geofence_Settings } = require('./model/hrmisdb');
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
    let sql = ``;

    
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
