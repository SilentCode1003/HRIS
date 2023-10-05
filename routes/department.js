const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('departmentlayout', { title: 'Express' });
});

module.exports = router;

router.get('/load', (req, res) => {
  try {
    let sql = 'select * from master_department';

    mysql.Select(sql, 'Master_Department', (err, result) => {
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
    
    let departmentname = req.body.tittle;
    let createdby = req.body.description;
    let createdate = currentDate.format('YYYY-MM-DD');
    let status = req.body.status;

  
    let data = [];
  
    data.push([
      departmentname, createdby, createdate, status,
    ])
    let query = `SELECT * FROM master_department WHERE md_departmentname = '${departmentname}'`;
    mysql.Select(query, 'Master_Department', (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist"
        });
      }
      else {
        mysql.InsertTable('master_department', data, (err, result) => {
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