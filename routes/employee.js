const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();
const currentDate = moment();


/* GET home page. */
router.get('/', function(req, res, next) {
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

router.post('/save', (req, res) => {
  try {
    
    let id = req.body.id;
    let firstname = req.body.firstname;
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
  
    data.push([
      id, firstname, lastname, birthday,
      gender, phone, email, hiredate,
      jobstatus, ercontactname, ercontactphone, department,
      position, address,
    ])

    let query = `SELECT * FROM master_employee WHERE me_id = '${id}'`;
    mysql.Select(query, 'Master_Employee', (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist"
        });
      }
      else {
        mysql.InsertTable('master_employee', data, (err, result) => {
          if (err) console.error('Error: ', err);

          console.log(result);

          res.json({
            msg: 'success'
          })
        })
      }
    });

    
  } catch (error) {
    res.json({
      msg: 'error'
    })
  }
  });


