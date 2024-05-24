const mysql = require('./repository/hrmisdb');
//const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
//const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('rejectedleavelayout', { title: 'Express' });
  Validator(req, res, 'rejectedleavelayout','rejectedleave');
});

module.exports = router;

router.get('/load', (req, res,) => {
  try {
    let sql = `SELECT DISTINCT
    l_leaveid,
    CONCAT(me_lastname, ' ', me_firstname) AS l_employeeid,
    ml_leavetype as l_leavetype,
    l_leavestartdate,
    l_leaveenddate,
    l_leavereason,
    l_leaveapplieddate,
    l_image,
    ml_totalleavedays,
    ml_unusedleavedays,
    ml_usedleavedays,
    ml_year,
    l_leavestatus,
    l_leaveduration
    FROM
    leaves 
    INNER JOIN
    master_leaves  ON l_leavetype = ml_id
    INNER JOIN
    master_employee  ON l_employeeid = me_id
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