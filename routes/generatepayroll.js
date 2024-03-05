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



router.post('/generateAndLoadPayroll', (req, res) => {
  try {
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let generateSql = `call hrmis.GeneratePayroll('${startdate}', '${enddate}')`;
    let loadSql = `call hrmis.LoadPayroll('${startdate}', '${enddate}')`;

    mysql.mysqlQueryPromise(generateSql)
    .then((generateResult) => {
      console.log("Payroll generated:", generateResult);
      return mysql.mysqlQueryPromise(loadSql);
    })
    .then((loadResult) => {
      console.log("Payroll loaded:", loadResult);
      res.json({
        msg: 'success',
        data: loadResult,
      });
    })
    .catch((error) => {
      console.error("Error:", error);
      res.json({
        msg: 'error',
        data: error,
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.json({ 
      msg: 'error',
      data: error,
    });
  }
});



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



router.post('/LoadPayslipSummary', (req,res) => {
  try {
    let payrolldate = req.body.payrolldate;
    let employeeid = req.body.employeeid;
    let sql = `call hrmis.LoadPayslipSummary('${payrolldate}', '${employeeid}')`

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



router.post('/LoadPayslipDetailed', (req,res) => {
  try {
    let payrolldate = req.body.payrolldate;
    let employeeid = req.body.employeeid;
    let sql = `call hrmis.LoadPayslipDetailed('${payrolldate}', '${employeeid}')`

    console.log(payrolldate);
    console.log(employeeid);

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


router.post('/getpayrolldate' , (req, res) => {
  try {
    let sql =  `SELECT DISTINCT 
    DATE_FORMAT(gp_payrolldate, '%Y-%m-%d') as gp_payrolldate,
    gp_cutoff
    FROM 
    generate_payroll  
    ORDER BY 
    gp_payrolldate DESC
    LIMIT 2`;

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      res.json({
        msg:'success',
        data:result,
      });
    })
    .catch((error) => {
      res.json({
        msg:'error',
        data: error,
      })
    })
  } catch (error) {
    res.json({
      msg:'error',
      data: error
    });
  }
});


router.post('/loadpayslipsummaryforapp', (req, res) =>{
  try {
    let payrolldate1 = req.body.payrolldate1;
    let payrolldate2 = req.body.payrolldate2;
    let employeeid = req.body.employeeid;
    let sql = `call hrmis.LoadPayslipSummaryForApp('${payrolldate1}', '${payrolldate2}', '${employeeid}')`;



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






