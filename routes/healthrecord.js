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
