const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();


/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('deductionlayout', { title: 'Express' });
  Validator(req, res, 'deductionlayout');
});

module.exports = router;

router.get('/load', (req, res) => {
  try {
    let sql =  `select * from master_deductions`;

    mysql.Select(sql, "Master_Deductions", (err, result) => {
      if (err) console.error("Error", err);

      res.json({
        msg: 'success',
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});