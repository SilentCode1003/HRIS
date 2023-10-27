const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('allleavelayout', { title: 'Express' });
});

module.exports = router;

router.get('/load', (req, res) => {
  try {
    let sql = 'SELECT leaves.*, CONCAT(master_employee.me_firstname, " ", master_employee.me_lastname) AS l_employeeid FROM leaves JOIN master_employee ON leaves.l_employeeid = master_employee.me_id';

    mysql.Select(sql, 'Leaves', (err, result) => {
      if (err) {
        console.error('Error: ', err);
        res.status(500).json({ msg: 'Error fetching data' });
        return;
      }

      res.json({ msg: 'success', data: result });
    });
  } catch (error) {
    res.status(500).json({ msg: 'Internal server error', error: error.message });
  }
});


