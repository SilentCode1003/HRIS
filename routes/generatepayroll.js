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



router.post('/viewpayslip', (req,res) => {
  try {
    let generateid = req.body.generateid;
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






