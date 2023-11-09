const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('accesslayout', { title: 'Express' });
});

module.exports = router;


router.post('/getaccess', (req, res) => {
  try {
    let accessid = req.body.accessid;
    let sql = `select 
    ma_accessid as accessid,
    ma_accessname as accessname,
    ma_createby as createby,
    ma_createdate as createdate,
    ma_status as status 
    from master_access
    where ma_accessid = '${accessid}'`;

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
    let sql = 'select * from master_access';

    mysql.Select(sql, 'Master_Access', (err, result) => {
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
    
    let accessname = req.body.accessname;
    let createby = req.body.createby;
    let createdate = currentDate.format('YYYY-MM-DD');
    let status = req.body.status;

  
    let data = [];
  
    data.push([
      accessname, createby, createdate, status,
    ])
    let query = `SELECT * FROM master_access WHERE ma_accessname = '${accessname}'`;
    mysql.Select(query, 'Master_Access', (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist"
        });
      }
      else {
        mysql.InsertTable('master_access', data, (err, result) => {
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
      let accessid = req.body.accessid;
      let accessname = req.body.accessname;
      let createby = req.body.createby;
      let status = req.body.status;
      
      let sqlupdate = `UPDATE master_access SET 
      ma_accessname ='${accessname}', 
      ma_createby ='${createby}',
      ma_status ='${status}' 
      WHERE ma_accessid ='${accessid}'`;

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
    } catch (error) {
      res.json({
        msg: 'error'
      })
    }
  });

      
      
  


