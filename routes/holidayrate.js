const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('holidayratelayout', { title: 'Express' });
  Validator(req, res, 'holidayratelayout');
});

module.exports = router;

router.post('/getholidayrate', (req, res) => {
  try {
    let holidayrateid = req.body.holidayrateid;
    let sql = `SELECT
    mhr_holidaydate as holidaydate,
    mhr_holidayrate as holidayrate,
    mhr_holidaystatus as holidaystatus
    FROM master_holidayrate
    inner join master_holiday on master_holidayrate.mhr_holidaydate = mh_holidayid
    WHERE mhr_holidayrateid = '${holidayrateid}'`;

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
    mhr_holidayrateid,
    mh_date as mhr_holidaydate,
    mhr_holidayrate,
    mhr_holidaystatus,
    mhr_createby,
    mhr_createdate
    from master_holidayrate
    LEFT JOIN master_holiday ON master_holidayrate.mhr_holidaydate = mh_holidayid`;

    mysql.Select(sql, 'Master_HolidayRate', (err, result) => {
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
    let holidaydate = req.body.holidaydate;
    let holidayrate = req.body.holidayrate;
    let holidaystatus = 'Active'; 
    let createby = req.session.fullname; 
    let createdate = currentDate.format('YYYY-MM-DD');

    const holidaydateIdQuery = `SELECT mh_holidayid FROM master_holiday WHERE mh_date = '${holidaydate}'`;

    const holidaydateIdResult = await mysql.mysqlQueryPromise(holidaydateIdQuery, [holidaydate]);

    if (holidaydateIdResult.length > 0) {
      const holidaydateId = holidaydateIdResult[0].mh_holidayid;

      const data = [
        [holidaydateId, holidayrate , holidaystatus, createby, createdate]
      ];

      mysql.InsertTable('master_holidayrate', data, (insertErr, insertResult) => {
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
    let holidayrateid = req.body.holidayrateid;
    let holidaydate = req.body.holidaydate;
    let holidayrate = req.body.holidayrate;
    let holidaystatus = req.body.holidaystatus;
    let createby = req.session.fullname;

    console.log(`${holidaydate}`,`${holidayrate}`);
    
    let sqlupdate = `UPDATE master_holidayrate SET   
    mhr_holidaydate ='${holidaydate}', 
    mhr_holidayrate ='${holidayrate}', 
    mhr_holidaystatus ='${holidaystatus}',
    mhr_createby ='${createby}' 
    WHERE mhr_holidayrateid ='${holidayrateid}'`;

    mysql.Update(sqlupdate)
    .then((result) =>{
      res.json({
        msg: 'success',
        data : result,
      });
    })
    .catch((error) =>{
      res.json({
        msg:'error',
        data: error,
      })
      
    });
  } catch (error) {
    res.json({
      msg: 'error',
      data: error,
    })
  }
});
