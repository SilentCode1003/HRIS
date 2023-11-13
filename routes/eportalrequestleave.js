const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('eportalrequestleavelayout', { title: 'Express' });
  Validator(req, res, 'eportalrequestleavelayout');
});

module.exports = router;

router.post('/submit', async (req, res) => {
  try {
    const employeeid = req.session.employeeid; // Retrieve the employee ID from the session
    const { startdate, enddate, leavetype, reason } = req.body;
    const createdate = currentDate.format('YYYY-MM-DD');
    const status = 'Pending'; // You can set an initial status for the leave request

    // Check if the employee ID is valid (you might want to add more validation)
    const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
    const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

    if (employeeResult.length === 0) {
      return res.json({ msg: 'Invalid employee ID' });
    }

    const data = [
      [employeeid, startdate, enddate, leavetype, reason, status, createdate]
    ];

    // Insert the leave request into the master_leave table
    mysql.InsertTable('leaves', data, (insertErr, insertResult) => {
      if (insertErr) {
        console.error('Error inserting leave record: ', insertErr);
        res.json({ msg: 'insert_failed' });
      } else {
        console.log(insertResult);
        res.json({ msg: 'success' });
      }
    });
  } catch (error) {
    console.error('Error in /submit route: ', error);
    res.json({ msg: 'error' });
  }
});


router.get('/load',(req , res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT * FROM leaves WHERE l_employeeid = '${employeeid}'`;

    mysql.Select(sql, 'Leaves', (err, result) => {
      if (err) console.error('Error: ', err);

      res.json({
        msg: "success",
        data: result,
      });
    })
  } catch (error) {
    res.json({
      msg: 'error', error
    })
    
  }
})

// router.get('/load/:employeeid', async (req, res) => {
//   try {
//     const employeeid = req.params.employeeid;

//     // Query the database to fetch leave records for the employee
//     const leaveQuery = `SELECT * FROM leaves WHERE l_employeeid = '${employeeid}'`;

//     try {
//       const leaveRecords = await mysql.mysqlQueryPromise(leaveQuery);

//       res.json({
//         msg: 'success',
//         data: leaveRecords
//       });
//     } catch (error) {
//       console.error('Error querying leave records: ', error);
//       res.json({ msg: 'error' });
//     }
//   } catch (error) {
//     console.error('Error in /leave/:employeeid route: ', error);
//     res.json({ msg: 'error' });
//   }
// });


module.exports = router;

