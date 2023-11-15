const mysql = require('./repository/hrmisdb');
//const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
//const currentDate = moment();

/* GET home page. */
router.get('/', function (req, res, next) {
  // res.render('indexlayout', { title: 'Express' });

  Validator(req, res, 'indexlayout');
});

module.exports = router;

router.get('/load', (req, res,) => {
  try {
    let sql = `select 
    concat(me_firstname,'',me_lastname) as l_employeeid,
    l_leavestartdate,
    l_leaveenddate,
    l_leavetype,
    l_leavereason,
    l_leaveapplieddate
    from leaves
    left join master_employee on leaves.l_employeeid = me_id
    where l_leavestatus = 'Pending'`;

    mysql.Select(sql, 'Leaves', (err, result) => {
      if (err) console.error('Error: ', err);

      res.json({
        msg: 'success', data: result
      });
    });
  } catch (error) {
    console.log(error);
  }
})

router.post('/getleave', (req, res) => {
  try {
    let leaveid = req.body.leaveid;
    let sql = `select 
    concat(me_firstname,' ',me_lastname) as employeeid,
    me_email as email,
    me_gender as gender,
    me_phone as phone,
    l_leavetype as leavetype,
    l_leaveapplieddate as applieddate,
    l_leavestartdate as leavestartdate,
    l_leaveenddate as leaveenddate,
    l_leavereason as reason,
    l_leavestatus as status
    from leaves
    right join master_employee on leaves.l_employeeid = me_id
    where l_leaveid = '${leaveid}'`;

    mysql.mysqlQueryPromise(sql)
    //console.log(sql)
    .then((result) => {
      if (result.length > 0) {
        res.status(200).json({
          msg: "success",
          data: result
        });
      } else {
        res.status(404).json({
          msg: "Department not found"
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        msg: "Error fetching department data",
        error: error
      });
    });  
  } catch (error) {
    res.json({
      msg:error
    })
    
  }
});

