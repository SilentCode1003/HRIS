const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('healthrecordlayout', { title: 'Express' });
});

module.exports = router;

router.get('/load', (req, res) => {
    try {
      let sql = 'select * from master_health';
  
      mysql.Select(sql, 'Master_Health', (err, result) => {
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
      let bloodtype = req.body.bloodtype;
      let medicalcondition = req.body.medicalcondition;
      let prescribemedications = req.body.prescribemedications;
      let ercontactname = req.body.ercontactname;
      let ercontactphone = req.body.ercontactphone;
      let lastcheckup = req.body.lastcheckup;
      let insurance = req.body.insurance;
      let insurancenumber = req.body.insurancenumber;
  
    
      let data = [];
    
      data.push([
        employeeid, bloodtype, medicalcondition, prescribemedications, ercontactname, ercontactphone,
        lastcheckup, insurance, insurancenumber,
      ])
      let query = `SELECT * FROM master_health WHERE mh_employeeid = '${departmentname}'`;
      mysql.Select(query, 'Master_Health', (err, result) => {
        if (err) console.error("Error: ", err);
  
        if (result.length != 0) {
          res.json({
            msg: "exist"
          });
        }
        else {
          mysql.InsertTable('master_health', data, (err, result) => {
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