const mysql = require('./repository/hrmisdb');
//const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
//const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('rejectedleavelayout', { title: 'Express' });
  Validator(req, res, 'rejectedleavelayout');
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
    where l_leavestatus = 'Rejected'`;
    
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