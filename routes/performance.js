const { Validator } = require('./controller/middleware');
const mysql = require('./repository/hrmisdb');
var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('performancelayout', { title: 'Express' });
  Validator(req, res, 'performancelayout');
});

module.exports = router;

router.post('/getperformance', (req, res) => {
  try {
    let performanceid = req.body.performanceid;
    let sql = `SELECT
      mpe_employeeid as employeeid,
      mpe_appraisaldate as appraisaldate,
      mpe_appraisaltype as appraisaltype,
      mpe_rating as rating,
      mpe_comments as comments
      FROM master_performance_emp
      WHERE mpe_performanceid = '${performanceid}'`;

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
    let sql = `SELECT 
    mpe_performanceid,
    concat(me_firstname, ' ', me_lastname) AS mpe_employeeid,
    mpe_appraisaldate,
    mpe_appraisaltype,
    mpe_rating,
    mpe_comments
   FROM master_performance_emp
    LEFT JOIN master_employee ON master_performance_emp.mpe_employeeid = me_id`;

    mysql.Select(sql, 'Master_Performance_Emp', (err, result) => {
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
    let appraisaldate = req.body.appraisaldate;
    let appraisaltype = req.body.appraisaltype;
    let rating = req.body.rating;
    let comments = req.body.comments;

  
    let data = [];
  
    data.push([
      employeeid, appraisaldate, appraisaltype, rating, comments,
    ])
    let query = `SELECT * FROM master_performance_emp WHERE mpe_employeeid = '${employeeid}'`;
    mysql.Select(query, 'Master_Performance_Emp', (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist"
        });
      }
      else {
        mysql.InsertTable('master_performance_emp', data, (err, result) => {
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
    let performanceid = req.body.performanceid;
    let employeeid = req.body.employeeid;
    let appraisaldate = req.body.appraisaldate;
    let appraisaltype = req.body.appraisaltype;
    let rating = req.body.rating;
    let comments = req.body.comments;
    
    let sqlupdate = `UPDATE master_performance_emp SET   
    mpe_employeeid ='${employeeid}', 
    mpe_appraisaldate ='${appraisaldate}', 
    mpe_appraisaltype ='${appraisaltype}',
    mpe_rating ='${rating}', 
    mpe_comments ='${comments}' 
    WHERE mpe_performanceid ='${performanceid}'`;

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