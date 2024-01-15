const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
const e = require('express');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('salarylayout', { title: 'Express' });
  Validator(req, res, "salarylayout");
});

module.exports = router;


router.get('/load', (req, res) => {
  try {
    let sql = 'select * from master_salary';

    mysql.Select(sql, 'Master_Salary', (err, result) => {
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

router.post('/save', (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let monthly = req.body.monthly;
    let allowances = req.body.allowances;

    let data = [];

    data.push([
      employeeid, monthly, allowances,
    ]);

    let sql = `SELECT * FROM master_salary WHERE ms_employeeid = '${employeeid}'`;

    mysql.Select(sql, 'Master_Salary', (err, result) => {
      if (err) console.log("Error: ", err);

      if (result.length !=0) {
        res.json({
          msg:'exist',
        });
      }
      else {
        mysql.InsertTable('master_salary', data, (err, result) => {
          if (err) console.log('Error: ', err);

          console,log(result);

          res.json({
            msg: 'success'
          })
        });
      }
    });

    
  } catch (error) {
    res.json({
      msg: 'error',
      data: error,
    });
  }
});