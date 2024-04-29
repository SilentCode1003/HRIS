const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('employeeprofilelayout', { title: 'Express' });

  Validator(req, res, 'empbackgroundlayout');
});

module.exports = router;


router.get('/load' , (req, res) => {
  try {
    let sql = `SELECT * FROM master_employee_background`;

    mysql.Select(sql , "Master_Employee_Background", (err, result) => {
      if (err) console.error("Error :" , err);

      console.log(result);

      res.json({
        msg:'success',
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    });
  }
});