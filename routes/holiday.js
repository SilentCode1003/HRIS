const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('holidaylayout', { title: 'Express' });
});

module.exports = router;


router.post('/getholiday', (req, res) => {
  try {
    let holidayid = req.body.holidayid;
    let sql = `SELECT
      mh_date as date,
      mh_description as description,
      mh_createby as createby,
      mh_status as status
      FROM master_holiday
      WHERE mh_holidayid = '${holidayid}'`;

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

router.get('/load', (req, res) => {
  try {
    let sql = 'select * from master_holiday';

    mysql.Select(sql, 'Master_Holiday', (err, result) => {
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
    
    let date = req.body.date;
    let description = req.body.description;
    let createdate = currentDate.format('YYYY-MM-DD');
    let createby = req.body.createby;
    let status = req.body.status;

  
    let data = [];
  
    data.push([
      date, description, createdate, createby, status,
    ])
    let query = `SELECT * FROM master_holiday WHERE mh_date = '${date}'`;
    mysql.Select(query, 'Master_Holiday', (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist"
        });
      }
      else {
        mysql.InsertTable('master_holiday', data, (err, result) => {
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

  router.post('/update', (req, res) => {
    try {
      let holidayid = req.body.holidayid;
      let date = req.body.date;
      let description = req.body.description;
      let createby = req.body.createby;
      let status = req.body.status;
      
      let sqlupdate = `UPDATE master_holiday SET   
      mh_date ='${date}', 
      mh_description ='${description}', 
      mh_createby ='${createby}',
      mh_status ='${status}' 
      WHERE mh_holidayid ='${holidayid}'`;

      mysql.Update(sqlupdate)
      .then((result) =>{
        console.log(result);
    
        res.json({
          msg: 'success'
        })
      })
      .catch((error) =>{
        res.json({
          msg:error
        })
        
      });
      
      // mysql.Update(sqlupdate, (err,result) =>{
      //   if(err) console.error('Error: ', err);
    
      //   console.log(result);
    
      //   res.json({
      //     msg: 'success'
      //   })
      // })
    
    } catch (error) {
      res.json({
        msg: 'error'
      })
    }
    });

