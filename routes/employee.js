const mysql = require('./repository/hrmisdb');
const moment = require('moment');
const express = require('express');
const router = express.Router();


const currentYear = moment().format('YY');
const currentMonth = moment().format('MM');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('employeelayout', { title: 'Express' });
});

module.exports = router;

router.post('/getemployee', (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select * from master_employee where me_id='${employeeid}'`;

    mysql.Select(sql, 'Master_Employee', (err, result) => {
      if (err) console.error('Error: ', err);

      res.json({
        msg: 'success', data: result
      });
    });
  } catch (error) {
    res.json({
      msg: error
    })
  }
});

router.get('/load', (req, res) => {
  try {
    let sql = `
      SELECT
        me_id,
        CONCAT(master_employee.me_firstname, " ", master_employee.me_lastname) AS me_firstname, me_phone,
        me_phone,
        me_email,
        md_departmentname AS me_department,  -- Fetch department name from master_department table
        mp_positionname AS me_position
      FROM master_employee
      LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
      LEFT JOIN master_position ON master_employee.me_position = mp_positionid
    `;

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

// Function to convert an image file to a base64-encoded string

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
    let departmentName = req.body.department; // Get the department name from the request
    let positionName = req.body.position; // Get the position name from the request
    let address = req.body.address;
    let profilePicturePath = req.body.profilePicturePath; // Get the profile picture path from the request
    let data = [];

    const employeeExists = await checkEmployeeExists(firstname, lastname);


    if (employeeExists) {
      // The employee already exists
      res.json({ msg: 'exist' });
      return;
    }

    generateEmployeeId(currentYear, currentMonth)
      .then(async (newEmployeeId) => {
        // Check if the employee ID already exists in the table

        // Fetch the department ID based on the department name
        const departmentIdQuery = `SELECT md_departmentid FROM master_department WHERE md_departmentname = '${departmentName}'`;

        try {
          const departmentIdResult = await mysql.mysqlQueryPromise(departmentIdQuery);
          const departmentId = departmentIdResult[0].md_departmentid;

          // Fetch the position ID based on the position name
          const positionIdQuery = `SELECT mp_positionid FROM master_position WHERE mp_positionname = '${positionName}'`;

          try {
            const positionIdResult = await mysql.mysqlQueryPromise(positionIdQuery);
            const positionId = positionIdResult[0].mp_positionid;


            data.push([
              newEmployeeId, firstname, middlename, lastname, birthday, gender, phone, email, hiredate,
              jobstatus, ercontactname, ercontactphone, departmentId, positionId, address, profilePicturePath
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
          } catch (positionIdError) {
            console.error('Error fetching position ID: ', positionIdError);
            res.json({ msg: 'position_id_fetch_error' });
          }
        } catch (departmentIdError) {
          console.error('Error fetching department ID: ', departmentIdError);
          res.json({ msg: 'department_id_fetch_error' });
        }
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



 router.post('/update', async (req, res) => {
  try {
    const newEmployeeId = req.body.newEmployeeId;
    
    const {
      firstname,
      middlename,
      lastname,
      birthday,
      gender,
      phone,
      hiredate,
      jobstatus,
      ercontactname,
      ercontactphone,
      departmentId,
      positionId,
      address,
      profilePicturePath,

    } = req.body;

    const sqlupdate = `UPDATE master_employee set
    me_firstname = ?,
    me_middlename = ?,
    me_lastname = ?,
    me_birthday = ?,
    me_gender = ?,
    me_phone = ?,
    me_hiredate = ?,
    me_jobstatus = ?,
    me_ercontactname = ?,
    me_ercontactphone = ?,
    me_department = ?,
    me_position = ?,
    me_address = ?,
    me_profile_pic = ?
  WHERE me_id = ?`;

    const values = [
      firstname,
      middlename,
      lastname,
      birthday,
      gender,
      phone,
      hiredate,
      jobstatus,
      ercontactname,
      ercontactphone,
      departmentId,
      positionId,
      address,
      profilePicturePath,
      newEmployeeId
    ];

    console.log(values);


    mysql.UpdateMultiple(sqlupdate, values, (err, result) => {
      if (err) console.error("Error: ", err);

      console.log(result);
      res.json({
        msg: 'success'
      })
    });

    //return promise
    // mysql.Update(sql_statement)
    //   .then((result) => {
    //     console.log(result);

    //   }).catch((error) => {
    //     return res.json({
    //       msg: error
    //     })
    //   });

  } catch (error) {
    res.status(500).json({ msg: 'error' });
  }
});


module.exports = router;


