const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('healthrecordlayout', { title: 'Express' });
  Validator(req, res, 'healthrecordlayout');
});

module.exports = router;

router.post('/gethealthrecord', (req, res) => {
  try {
    let healthid = req.body.healthid;
    let sql = `SELECT
    mh_employeeid as employeeid,
    mh_bloodtype as bloodtype,
    mh_medicalcondition as medicalcondition,
    mh_prescribemedications as prescribemedications,
    mh_lastcheckup as lastcheckup,
    mh_insurance as insurance,
    mh_insurancenumber as insurancenumber,
    mh_ercontactname as ercontactname,
    mh_ercontactphone as ercontactphone
    FROM master_health
    WHERE mh_healthid = '${healthid}'`;

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
    mh_healthid,
    concat(me_firstname, ' ', me_lastname) AS mh_employeeid,
    mh_bloodtype,
    mh_medicalcondition,
    mh_prescribemedications,
    mh_lastcheckup
   FROM master_health
    LEFT JOIN master_employee ON master_health.mh_employeeid = me_id`;

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

router.post('/save', async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let bloodtype = req.body.bloodtype;
    let medicalcondition = req.body.medicalcondition;
    let prescribemedications = req.body.prescribemedications;
    let ercontactname = req.body.ercontactname;
    let ercontactphone = req.body.ercontactphone;
    let lastcheckup = req.body.lastcheckup;
    let incsurance = req.body.incsurance;
    let insurancenumber = req.body.insurancenumber;
    let data = [];

    // Check if a record with the same employeeid exists in the master_health table
    const checkQuery = `SELECT * FROM master_health WHERE mh_employeeid = '${employeeid}'`;
    const checkParams = [employeeid];

    const existingRecord = await mysql.mysqlQueryPromise(checkQuery, checkParams);

    if (existingRecord.length > 0) {
      // A record with the same employeeid already exists
      res.json({ msg: 'exist' });
    } else {
      // If no existing record is found, insert the data into the master_health table
      data.push([
        employeeid,
        bloodtype,
        medicalcondition,
        prescribemedications,
        ercontactname,
        ercontactphone,
        lastcheckup,
        incsurance,
        insurancenumber
      ]);

      mysql.InsertTable('master_health', data, (insertErr, insertResult) => {
        if (insertErr) {
          console.error('Error inserting record: ', insertErr);
          res.json({ msg: 'insert_failed' });
        } else {
          console.log(insertResult);
          res.json({ msg: 'success' });
        }
      });
    }
  } catch (error) {
    console.error('Error: ', error);
    res.json({ msg: 'error' });
  }
});

router.post('/update', (req, res) => {
  try {
    let healthid = req.body.healthid;
    let employeeid = req.body.employeeid;
    let bloodtype = req.body.bloodtype;
    let medicalcondition = req.body.medicalcondition;
    let prescribemedications = req.body.prescribemedications;
    let ercontactname = req.body.ercontactname;
    let ercontactphone = req.body.ercontactphone;
    let lastcheckup = req.body.lastcheckup;
    let insurance = req.body.insurance; 
    let insurancenumber = req.body.insurancenumber; 

    let sqlupdate = `UPDATE master_health SET   
    mh_employeeid ='${employeeid}', 
    mh_bloodtype ='${bloodtype}', 
    mh_medicalcondition ='${medicalcondition}',
    mh_prescribemedications ='${prescribemedications}',
    mh_ercontactname = '${ercontactname}',
    mh_ercontactphone = '${ercontactphone}',
    mh_lastcheckup ='${lastcheckup}',
    mh_insurance ='${insurance}',
    mh_insurancenumber ='${insurancenumber}'
    WHERE mh_healthid ='${healthid}'`;

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
