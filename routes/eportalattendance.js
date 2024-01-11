const mysql = require('./repository/hrmisdb');
//const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
//const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('eportalattendancelayout', { title: 'Express' });
  Validator(req, res, 'eportalattendancelayout');
});

module.exports = router;


router.get("/load", (req, res) => {
  try {
      let employeeid = req.session.employeeid;
      let sql =`SELECT
      CONCAT(me_lastname, " ", me_firstname) as employeeid,
      ma_attendancedate as attendancedate,
      TIME_FORMAT(ma_clockin, '%H:%i:%s') as clockin,
      TIME_FORMAT(ma_clockout, '%H:%i:%s') as clockout,
      ma_devicein as devicein,
      ma_deviceout as deviceout,
      CONCAT(
          FLOOR(TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) / 3600), 'h ',
          FLOOR((TIMESTAMPDIFF(SECOND, ma_clockin, ma_clockout) % 3600) / 60), 'm'
      ) AS totalhours
      FROM master_attendance
      LEFT JOIN master_employee ON ma_employeeid = me_id
       where ma_employeeid = '${employeeid}'
      ORDER BY ma_attendanceid DESC;`;

      mysql.mysqlQueryPromise(sql)
      .then((result) => {
          res.json({
              msg: 'success',
              data: result,
          });
      })
      .catch((error) => {
          res.json({
              msg:'error',
              data: error,
          });
      })
  } catch (error) {
      console.log('error',error)
  }
});