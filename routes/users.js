const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Encrypter } = require('./repository/crytography');
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('userslayout', { title: 'Express' });
});

module.exports = router;

router.post('/save', async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let accesstype = req.body.accesstype; 
    let createby = req.body.createby;
    let createdate = currentDate.format('YYYY-MM-DD'); 
    let status = req.body.status;

       // Query the database to get the employee's birthday
    const birthdayQuery = `SELECT SUBSTRING(REPLACE(me_birthday, '-', ''), 3) AS birthday
    FROM master_employee
    WHERE me_id = '${employeeid}'`;

    try {
      const birthdayresult = await mysql.mysqlQueryPromise(birthdayQuery);

      console.log(birthdayresult);

      if (birthdayresult.length > 0) {
        const birthday = birthdayresult[0].birthday;

        // Query the database to get the first letter of the first name and the last name
        const nameQuery = `SELECT LEFT(me_firstname, 1) AS me_firstname, me_lastname
        FROM master_employee
        WHERE me_id = '${employeeid}'`;

        try {
          const nameresult = await mysql.mysqlQueryPromise(nameQuery);

          console.log(nameresult);

          if (nameresult.length > 0) {
            const { me_firstname, me_lastname: me_lastname } = nameresult[0];

            // Generate username by combining the first letter of the first name and the last name
            const username = me_firstname.charAt(0).toLowerCase() + me_lastname.toLowerCase();

            // Generate the password by combining employeeid and birthday
            const password = employeeid + birthday;

            Encrypter(password, async (err, encrypted) => {
              if (err) {
                console.error("Error: ", err);
                res.json({ msg: 'error' });
              }
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
            });
          } else {
            console.error('No employee found with that ID');
            res.json({ msg: 'No employee found with that ID' });
          }
        } catch (nameerror) {
          console.error('Error querying name: ', nameerror);
          res.json({ msg: 'error' });
        }
      } else {
        console.error('No employee found with that ID');
        res.json({ msg: 'No employee found with that ID' });
      }
    } catch (birthdayerror) {
      console.error('Error querying birthday: ', birthdayerror);
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
