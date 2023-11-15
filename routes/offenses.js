const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('offenseslayout', { title: 'Express' });
  Validator(req, res, 'offenseslayout');
});

module.exports = router;

router.get('/load', (req, res) => {
  try {
    let sql = 'select * from master_offense';

    mysql.Select(sql, 'Master_Offense', (err, result) => {
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
    
    let offensename = req.body.offensename;
    let createby = req.session.fullname; 
    let createdate = currentDate.format('YYYY-MM-DD');
    let status = req.body.status;

  
    let data = [];
  
    data.push([
      offensename, createby, createdate, status,
    ])
    let query = `SELECT * FROM master_offense WHERE mo_offensename = '${offensename}'`;
    mysql.Select(query, 'Master_Offense', (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist"
        });
      }
      else {
        mysql.InsertTable('master_offense', data, (err, result) => {
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

  router.post('/getoffenses', (req, res) => {
    try {
      let offenseid = req.body.offenseid;
      let sql = `SELECT
        mo_offensename as offensename,
        mo_createdby as createdby,
        mo_status as status
        FROM master_offense
        WHERE mo_offenseid = '${offenseid}'`;
  
      mysql.mysqlQueryPromise(sql)
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
      res.status(500).json({
        msg: "Internal server error",
        error: error
      });
    }
  });
  

