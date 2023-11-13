const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Encrypter } = require('./repository/crytography');
const { generateUsernameAndPassword } = require('./helper');
const { Validator } = require('./controller/middleware');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function (req, res, next) {
  //res.render('userslayout', { title: 'Express' });

  Validator(req, res, 'userslayout');
});

module.exports = router;

router.post('/save', async (req, res) => {
  try {
    const { employeeid, accesstype, createby, status } = req.body;
    const createdate = currentDate.format('YYYY-MM-DD');

    const employeeQuery = `SELECT me_id, me_firstname, me_lastname, me_birthday FROM master_employee WHERE me_id = '${employeeid}'`;

    try {
      const employeeresult = await mysql.mysqlQueryPromise(employeeQuery);

      if (employeeresult.length > 0) {
        const employee = employeeresult[0];
        const { username, password } = generateUsernameAndPassword(employee);

        Encrypter(password, async (err, encrypted) => {
          if (err) {
            console.error("Error: ", err);
            res.json({ msg: 'error' });
          } else {
            const data = [
              [employeeid, username, encrypted, accesstype, createby, createdate, status]
            ];

            mysql.InsertTable('master_user', data, (inserterr, insertresult) => {
              if (inserterr) {
                console.error('Error inserting record: ', inserterr);
                res.json({ msg: 'insert failed' });
              } else {
                console.log(insertresult);
                res.json({ msg: 'success' });
              }
            });
          }
        });
      } else {
        console.error('No employee found with that ID');
        res.json({ msg: 'No employee found with that ID' });
      }
    } catch (employeeerror) {
      console.error('Error querying employee: ', employeeerror);
      res.json({ msg: 'error' });
    }
  } catch (error) {
    console.error('Error: ', error);
    res.json({ msg: 'error' });
  }
});



router.get('/load', (req, res) => {
  try {
    let sql = `SELECT 
    mu_userid,
    mu_employeeid,
    mu_username,
    mu_password,
    ma_accessname as mu_accesstype,
    mu_createby,
    mu_createdate,
    mu_status
    from master_user
    LEFT JOIN master_access ON master_user.mu_accesstype = ma_accessid`;

    mysql.Select(sql, 'Master_User', (err, result) => {
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
