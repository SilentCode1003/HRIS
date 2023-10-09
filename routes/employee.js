const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();
const currentYear = moment().format('YY');
const currentMonth = moment().format('MM');


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('employeelayout', { title: 'Express' });
});

module.exports = router;

router.get('/load', (req, res) => {
  try {
    let sql = 'SELECT me_id, CONCAT(master_employee.me_firstname, " ", master_employee.me_lastname) AS me_firstname, me_phone, me_email, me_department, me_position FROM master_employee';

    mysql.Select(sql, 'Master_Employee', (err, result) => {
      if (err) {
        console.error('Error: ', err);
        res.status(500).json({ msg: 'Error fetching data' });
        return;
      }

      res.json({ msg: 'success', data: result });
    });
  } catch (error) {
    res.status(500).json({ msg: 'Internal server error', error: error.message });
  }
});

// Function to check if a record with the same firstname and lastname exists
function checkEmployeeExists(firstname, lastname) {
  return new Promise((resolve, reject) => {
    const checkQuery = `SELECT COUNT(*) AS count FROM master_employee WHERE me_firstname = '${firstname}' AND me_lastname = '${lastname}'`;

    mysql.mysqlQueryPromise(checkQuery)
      .then((result) => {
        const count = parseInt(result[0].count);

        if (count > 0) {
          // The employee with the same firstname and lastname already exists
          resolve(true);
        } else {
          // The employee does not exist
          resolve(false);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}



// Function to generate the employee ID
function generateEmployeeId(year, month) {
  // Query to find the maximum sequence number for the current year and month

  return new Promise((resolve, reject) => {
    const maxIdQuery = `SELECT count(*) as count FROM master_employee WHERE me_id LIKE '${year}${month}%'`;
    mysql.mysqlQueryPromise(maxIdQuery).then((result) => {

      let currentCount = parseInt(result[0].count) + 1;
      const paddedNumericPart = String(currentCount).padStart(2, '0');

      let newEmployeeID = `${year}${month}${paddedNumericPart}`;

      resolve(newEmployeeID);
    }).catch((error) => {
      reject(error);
    });
  });
  
}

// Usage in your /save route
router.post('/save', async (req, res) => {
  try {
    let firstname = req.body.firstname;
    let middlename = req.body.middlename;
    let lastname = req.body.lastname;
    let birthday = req.body.birthday;
    let gender = req.body.gender;
    let phone = req.body.phone;
    let email = req.body.email;
    let hiredate = req.body.hiredate;
    let jobstatus = req.body.jobstatus;
    let ercontactname = req.body.ercontactname;
    let ercontactphone = req.body.ercontactphone;
    let department = req.body.department;
    let position = req.body.position;
    let address = req.body.address;
    let data = [];

    const employeeExists = await checkEmployeeExists(firstname, lastname);

    if (employeeExists) {
      // The employee already exists
      res.json({ msg: 'exist' });
      return;
    }

    generateEmployeeId(currentYear, currentMonth)
      .then((newEmployeeId) => {
        console.log(newEmployeeId);
        // Check if the employee ID already exists in the table
        data.push([
          newEmployeeId, firstname, middlename, lastname, birthday, gender, phone, email, hiredate,
          jobstatus, ercontactname, ercontactphone, department, position, address
        ]);



        mysql.InsertTable('master_employee', data, (insertErr, insertResult) => {
          if (insertErr) {
            console.error('Error inserting record: ', insertErr);
            res.json({ msg: 'insert_failed' });
          } else {
            console.log(insertResult);
            res.json({ msg: 'success' });
          }
        });
      }).catch((error) => {
        res.json({
          msg: error
        });
      });

  } catch (error) {
    console.error('Error in /save route: ', error);
    res.json({ msg: 'error' });
  }
});