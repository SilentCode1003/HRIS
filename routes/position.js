const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('positionlayout', { title: 'Express' });
});

module.exports = router;

router.get('/load', (req, res) => {
  try {
    let sql = 'select * from master_position';

    mysql.Select(sql, 'Master_Position', (err, result) => {
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