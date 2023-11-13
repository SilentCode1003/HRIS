const mysql = require('./repository/hrmisdb');
//const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
//const currentDate = moment();

/* GET home page. */
router.get('/', function (req, res, next) {
  // res.render('indexlayout', { title: 'Express' });

  Validator(req, res, 'indexlayout');
});

module.exports = router;

router.get('/load', (req, res,) => {
  try {
    let sql = `  
    select * from leaves
    where l_leavestatus = 'Pending'`;

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      if (result.length > 0) {
        res.status(200).json({
          msg: "success",
          data: result
        });
      } else {
        res.status(404).json({
          msg: "leave not found"
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        msg: "Error fetching leave data",
        error: error
      });
    });
  } catch (error) {
    console.log(error);
  }
})
