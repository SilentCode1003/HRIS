const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('shiftlayout', { title: 'Express' });
});

module.exports = router;

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

router.get('/load', (req, res) => {
  try {
    let sql = `SELECT 
    ms_shiftid,
    ms_shiftname,
    ms_status,
    md_departmentname as ms_department,
    ms_createby,
    ms_createdate
    from master_shift
    LEFT JOIN master_department ON master_shift.ms_department = md_departmentid`;

    mysql.Select(sql, 'Master_Shift', (err, result) => {
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
    let shiftname = req.body.shiftname;
    let status = req.body.status;
    let department = req.body.department; 
    let createby = req.body.createby;
    let createdate = currentDate.format('YYYY-MM-DD');
    console.log('Received department name:', department);

    const departmentIdQuery = `SELECT md_departmentid FROM master_department WHERE md_departmentname = '${department}'`;

    const departmentIdResult = await mysql.mysqlQueryPromise(departmentIdQuery, [department]);

    if (departmentIdResult.length > 0) {
      const departmentId = departmentIdResult[0].md_departmentid;

      const data = [
        [shiftname, departmentId, status, createby, createdate]
      ];

      mysql.InsertTable('master_shift', data, (insertErr, insertResult) => {
        if (insertErr) {
          console.error('Error inserting record: ', insertErr);
          res.json({ msg: 'insert_failed' });
        } else {
          console.log(insertResult);
          res.json({ msg: 'success' });
        }
      });
    } else {
      res.json({ msg: 'department_not_found' });
    }
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
    let createby = req.body.createby;
    
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