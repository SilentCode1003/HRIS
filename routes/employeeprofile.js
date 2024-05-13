const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('employeeprofilelayout', { title: 'Express' });

  Validator(req, res, 'employeeprofilelayout');
});

module.exports = router;


router.post('/loademployee', (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select 
    me_id as employeeid,
    CONCAT(
            TIMESTAMPDIFF(YEAR, me_hiredate, CURRENT_DATE), ' Years ',
            TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) % 12, ' Months ',
            DATEDIFF(CURRENT_DATE, DATE_ADD(me_hiredate, INTERVAL TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) MONTH)), ' Days'
            ) AS tenure,
    concat(me_firstname," ",me_middlename," ",me_lastname) as fullname,
    me_firstname as firstname, 
    me_middlename as middlename,
    me_lastname as lastname, 
    me_birthday as birthday,
    DATE_FORMAT(me_birthday, "%W %M %e %Y") as birthdayformat,  
    me_gender as gender,  
    me_civilstatus as civilstatus,
    me_phone as phone,  
    me_email as email, 
    me_hiredate as hiredate, 
    me_jobstatus as jobstatus, 
    me_ercontactname as emergencycontact, 
    me_ercontactphone as emergencyphone,
    md_departmentname as department, 
    mp_positionname as position, 
    me_address as address, 
    me_profile_pic as image
    from
    master_employee 
    inner join master_department on master_employee.me_department = md_departmentid
    inner join master_position on master_employee.me_position = mp_positionid
    where me_id = '${employeeid}'`

    mysql.mysqlQueryPromise(sql)
    .then((result) =>{
      res.json({
        msg:'success',
        data: result,
      });
    })
    .catch((error) => {
      res.jsonp({
        msg:'error',
        data: error,
      })
    })
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});

router.post('/loadleavestatus', (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select
    ml_leavetype,
    ml_totalleavedays,
    ml_unusedleavedays,
    ml_usedleavedays,
    ml_status
    from master_leaves
    where ml_employeeid = '${employeeid}'
    and ml_year = year(curdate());`;

    mysql.Select(sql, "Master_Leaves", (err, result) => {
      if (err) console.error("Error :", err);

      console.log(result);
      res.json({
        msg:'success',
        data: result,
      })
    });
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});


router.post('/loadwork', (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `	select
    meb_attainment,
    meb_tittle,
    meb_status,
    meb_start,
    meb_end
    from master_employee_background
    inner join master_employee on master_employee_background.meb_employeeid = me_id
    where meb_employeeid = '${employeeid}'
    and meb_type = 'Work Background'`;

    mysql.Select(sql, "Master_Employee_Background", (err, result) => {
      if (err) console.error("Error :", err);

      console.log(result);
      res.json({
        msg:'success',
        data: result,
      })
    });
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});


router.post('/loadeduc', (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = ` select
    meb_attainment,
    meb_tittle,
    meb_status,
    meb_start,
    meb_end
    from master_employee_background
    inner join master_employee on master_employee_background.meb_employeeid = me_id
    where meb_employeeid = '${employeeid}'
    and meb_type = 'Educational Background'`;

    mysql.Select(sql, "Master_Employee_Background", (err, result) => {
      if (err) console.error("Error :", err);

      console.log(result);
      res.json({
        msg:'success',
        data: result,
      })
    });
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});

