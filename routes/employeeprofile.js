const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('employeeprofilelayout', { title: 'Express' });
});

module.exports = router;

router.get('/load', (req, res) => {
  try {
    let sql = 'select * from master_employee';

    mysql.Select(sql, 'Master_Employee', (err, result) => {
      if (err) console.error('Error: ', err);

      res.json({
        msg: 'success', data: result
      });
    });
  } catch (error) {
    res.json({
      msg:error
    })
    
  }
});

router.post('/update', (req, res) => {
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
    let sqlupdate = `UPDATE master_employee SET  
    me_firstname = '${firstname}', 
    me_lastname ='${lastname}',
    me_birthday ='${birthday}',
    me_gender ='${gender}',
    me_phone ='${phone}',
    me_email ='${email}',
    me_hiredate ='${hiredate}',
    me_jobstatus ='${jobstatus}',
    me_ercontactname ='${ercontactname}',
    me_ercontactphone ='${ercontactphone}',
    me_department ='${department}',  
    me_position ='${position}',
    me_address = '${address}' WHERE me_id ='${id}'`;
    
    mysql.Update(sqlupdate, (err,result) =>{
      if(err) console.error('Error: ', err);
  
      console.log(result);
  
      res.json({
        msg: 'success'
      })
    })
  
  } catch (error) {
    res.json({
      msg: 'error'
    })
  }
  });