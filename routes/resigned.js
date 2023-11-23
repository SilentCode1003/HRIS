const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();
/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('resignedlayout', { title: 'Express' });
  Validator(req, res, 'resignedlayout');
});

module.exports = router;

router.get('/load', (req, res,) => {
    try {
      let sql = `select 
      mr_resignedid,
      concat(me_firstname,'',me_lastname) as mr_employeeid,
      mr_reason,
      mr_dateresigned,
      mr_status,
      mr_createby,
      mr_createdate
      from master_resigned
      left join master_employee on master_resigned.mr_employeeid = me_id`;
      
      mysql.Select(sql, 'Master_Resigned', (err, result) => {
        if (err) console.error('Error: ', err);
  
        res.json({
          msg: 'success', data: result
        });
      });
    } catch (error) {
      console.log(error);
    }
  });

  router.post('/save', (req, res) => {
    try {
      let newEmployeeId = req.body.newEmployeeId;
      let reason = req.body.reason;
      let dateresigned = req.body.dateresigned;
      let status = req.body.status;
      let createby = req.session.fullname; 
      let createdate = currentDate.format('YYYY-MM-DD');
  
      
      let data = [[newEmployeeId, reason, dateresigned, status, createby, createdate]];
  
      
      let query = `SELECT * FROM master_resigned WHERE mr_employeeid = '${newEmployeeId}'`;
  
      mysql.Select(query, 'Master_Resigned', (err, result) => {
        if (err) {
          console.error("Error: ", err);
          res.json({ msg: 'error' });
          return;
        }
  
        
        if (result.length != 0) {
          res.json({ msg: "exist" });
          return;
        }
  
      
        mysql.InsertTable('master_resigned', data, (err, result) => {
          if (err) {
            console.error('Error: ', err);
            res.json({ msg: 'error' });
            return;
          }
  
          console.log(result);
  
         
          res.json({ msg: 'success' });
        });
      });
    } catch (error) {
      console.error('Error: ', error);
      res.json({ msg: 'error' });
    }
  });

  router.post('/update', (req, res) => {
    try {
      let shiftid = req.body.shiftid;
      let shiftname = req.body.shiftname;
      let status = req.body.status;
      let department = req.body.department;
      let createby = req.session.fullname; 
      
      let sqlupdate = `UPDATE master_shift SET   
      ms_shiftname ='${shiftname}', 
      ms_status ='${status}', 
      ms_department ='${department}',
      ms_createby ='${createby}' 
      WHERE ms_shiftid ='${shiftid}'`;
  
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

  router.post('/getshift', (req, res) => {
    try {
      let shiftid = req.body.shiftid;
      let sql = `SELECT
        ms_shiftname as shiftname,
        ms_status as status,
        ms_department as department,
        ms_createby as createby
        FROM master_shift
        WHERE ms_shiftid = '${shiftid}'`;
  
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
