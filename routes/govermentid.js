const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('govermentidlayout', { title: 'Express' });
  Validator(req, res, 'govermentidlayout');
});

module.exports = router;


router.post('/getgovermentid', (req, res) => {
  try {
    let governmentid = req.body.governmentid;
    let sql = `SELECT
      mg_employeeid as employeeid,
      mg_idtype as idtype,
      mg_idnumber as idnumber,
      mg_issuedate as issuedate,
      mg_createby as createby,
      mg_status as status
      FROM master_govid
      WHERE mg_governmentid = '${governmentid}'`;

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

router.post('/save', async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let idtype = req.body.idtype;
    let idnumber = req.body.idnumber;
    let issuedate = req.body.issuedate;
    let createby = req.session.fullname; 
    let createdate = currentDate.format('YYYY-MM-DD');
    let status = 'Active';
    let data = [];

    // Check if a record with the same employeeid and idtype exists
    const checkQuery = `SELECT * FROM master_govid WHERE mg_employeeid = '${employeeid}' AND mg_idtype = '${idtype}'`;
    const checkParams = [employeeid, idtype];

    const existingRecord = await mysql.mysqlQueryPromise(checkQuery, checkParams);

    if (existingRecord.length > 0) {
      // A record with the same employeeid and idtype already exists
      res.json({ msg: 'exist' });
      return;
    }

    data.push([
      employeeid,
      idtype,
      idnumber,
      issuedate,
      createby,
      createdate,
      status
    ]);

    mysql.InsertTable('master_govid', data, (insertErr, insertResult) => {
      if (insertErr) {
        console.error('Error inserting record: ', insertErr);
        res.json({ msg: 'insert_failed' });
      } else {
        console.log(insertResult);
        res.json({ msg: 'success' });
      }
    });
  } catch (error) {
    console.error('Error: ', error);
    res.json({ msg: 'error' });
  }
});


router.get('/load', (req, res) => {
  try {
    let sql = `    
    SELECT 
mg_governmentid,
concat(me_firstname, ' ', me_lastname) AS mg_employeeid,
mg_idtype,
mg_idnumber,
mg_issuedate,
mg_createby,
mg_createdate,
mg_status
FROM master_govid
LEFT JOIN master_employee ON master_govid.mg_employeeid = me_id`;

    mysql.Select(sql, 'Master_GovId', (err, result) => {
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

router.post('/update', (req, res) => {
  try {
    let governmentid = req.body.governmentid;
    let employeeid = req.body.employeeid;
    let idtype = req.body.idtype;
    let idnumber = req.body.idnumber;
    let issuedate = req.body.issuedate;
    let createby = req.session.fullname; 
    let status = req.body.status; 

    let sqlupdate = `UPDATE master_govid SET   
    mg_employeeid ='${employeeid}', 
    mg_idtype ='${idtype}', 
    mg_idnumber ='${idnumber}',
    mg_issuedate ='${issuedate}', 
    mg_createby ='${createby}', 
    mg_status ='${status}'
    WHERE mg_governmentid ='${governmentid}'`;

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
