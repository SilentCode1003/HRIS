const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
var router = express.Router();
//const currentDate = moment();
/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('requestcashadvancelayout', { title: 'Express' });
  Validator(req, res, 'requestcashadvancelayout','requestcashadvance');
});

module.exports = router;


router.get('/load', (req, res) => {
  try {
    let sql = `SELECT
    ca_cashadvanceid,
     concat(me_lastname,' ',me_firstname) as ca_employeeid,
     ca_requestdate,
     ca_amount,
     ca_purpose,
     ca_status,
     ca_approvaldate
    FROM cash_advance JOIN master_employee 
    ON cash_advance.ca_employeeid = master_employee.me_id`;

    mysql.Select(sql, 'Cash_Advance', (err, result) => {
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

router.post('/update', (req, res) => {
  try {
    let cashadvanceid = req.body.cashadvanceid;
    let status = req.body.status;
    let comment = req.body.comment;

    let sqlupdate = `
      UPDATE cash_advance
      SET
        ca_status = '${status}',
        ca_comment = '${comment}',
        ca_approvaldate = IF('${status}' = 'approved', NOW(), 'Rejected')
      WHERE ca_cashadvanceid = '${cashadvanceid}'
    `;

    mysql.Update(sqlupdate)
      .then((result) => {
        console.log(sqlupdate);
        res.json({
          msg: 'success',
          data: result
        })
      })
      .catch((error) => {
        res.status(500).json({
          msg: 'error',
          error: error.message
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: 'error',
      error: error.message
    });
  }
});







router.post('/getreqca', (req, res) => {
  try {
    let cashadvanceid = req.body.cashadvanceid;
    let sql = ` select 
    concat(me_firstname,' ',me_lastname) as employeeid,
    me_email as email,
    me_gender as gender,
    me_phone as phone,
    ca_requestdate as requestdate,
    ca_amount as amount,
    ca_purpose as purpose,
    ca_status as status,
    ca_approvaldate as approvaldate
    from cash_advance
    left join master_employee on cash_advance.ca_employeeid = me_id
    where ca_cashadvanceid = '${cashadvanceid}'`;

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      console.log(cashadvanceid);
      res.json({
        msg: 'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg: 'error',
        data: error,
      });
    });
  } catch (error) {
    res.json({
      msg:error
    })
    
  }
});

