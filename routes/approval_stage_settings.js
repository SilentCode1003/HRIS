const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();


/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(req, res, 'approval_stage_settinglayout');
});

module.exports = router;


router.get("/load", (req, res) => {
    try {
      let sql = `SELECT * FROM aprroval_stage_settings`;
  
      mysql.Select(sql, "Approval_Stage_Settings", (err, result) => {
        if (err) console.error("Error Fetching Data: ", err);
  
        res.json({
          msg: "success",
          data: result,
        });
      });
    } catch (error) {
      res.json({
        msg: "error",
        data: error,
      });
    }
  });
