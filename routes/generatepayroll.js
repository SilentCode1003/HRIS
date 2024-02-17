const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('govermentidlayout', { title: 'Express' });
  Validator(req, res, 'generatepayrolllayout',);
});

module.exports = router;


router.post('/loadpayroll', (req, res) =>{
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let sql = `call hrmis.LoadPayroll('${startdate}', '${enddate}')`;



    mysql.mysqlQueryPromise(sql)
    .then((result) => {

      console.log(result);
      res.json({
        msg: 'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg: 'error',
        data: error,
      });
    })
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
    let sql = `call hrmis.GeneratePayroll('${startdate}', '${enddate}')`;

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      res.json({
        msg: 'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg: 'error',
        data: error,
      });
    })
  } catch (error) {
    res.json({ 
      msg: 'error',
      data: error,
    });
  }
});


// router.post('/loadpayroll', (req, res) => {
//   try {
//     let startdate = req.body.startdate;
//     let enddate = req.body.enddate;
//     let sql = `SELECT
//     '${startdate}' AS start_date,
//     '${enddate}' AS end_date,
//     gp.gp_employeeid,
//     SUM(COALESCE(gd.gd_amount, 0)) AS total_deductions,
//     (SUM(gp.gp_per_day) - SUM(COALESCE(gd.gd_amount, 0))) AS total_net_pay
// FROM
//     generate_payroll gp
// LEFT JOIN
//     government_deductions gd ON gp.gp_employeeid = gd.gd_employeeid
//     AND gp.gp_attendancedate BETWEEN @start_date AND @end_date
// GROUP BY
//     gp.gp_employeeid
// ORDER BY
//     gp.gp_employeeid ASC`;

//     mysql.mysqlQueryPromise(sql)
//     .then((result) => {
//       res.json({
//         msg:'success',
//         data: result,
//       });
//     })
//     .catch((error) => {
//       res.json({
//         msg:"error",
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


router.post('/viewpayslip', (req,res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let employeeid = req.body.employeeid;
    let sql = ``;

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      res.json({
        msg:'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg:'error',
        data: error,
      });
    })
    
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    })
  }
});






