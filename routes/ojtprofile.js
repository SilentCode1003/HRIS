const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { ValidatorforOjt } = require('./controller/middleware');
const { Encrypter, Decrypter } = require("./repository/crytography");
const { generateUsernameAndPasswordforOjt } = require("./helper");
var router = express.Router();
const currentDate = moment();

const currentYear = moment().format("YYYY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  ValidatorforOjt(req, res, 'ojtprofilelayout');
});

module.exports = router;

router.post('/load', (req, res) => {
  try {
    let ojtid = req.body.ojtid;
    let sql = ` select
    mo_id as id,
    mo_image AS image,
    mo_id AS id,
    CONCAT(mo_lastname, ' ', mo_name) AS fullname,
    md_departmentname as department,
    mo_school as school,
    mo_startdate AS DateStarted,
    mo_hours as TotalHours,
    SEC_TO_TIME(IFNULL(SUM(TIME_TO_SEC(TIMEDIFF(oa_clockout, oa_clockin))), 0)) AS AcumulatedHours,
    SEC_TO_TIME(TIME_TO_SEC(mo_hours) - IFNULL(SUM(TIME_TO_SEC(TIMEDIFF(oa_clockout, oa_clockin))), 0)) AS RemainingHours,
    DATE_ADD(NOW(), INTERVAL CEIL(TIME_TO_SEC(SEC_TO_TIME(TIME_TO_SEC(mo_hours) - IFNULL(SUM(TIME_TO_SEC(TIMEDIFF(oa_clockout, oa_clockin))), 0))) / 28800) DAY) AS EndDate
FROM
    master_ojt
    inner join master_department on mo_department = md_departmentid
LEFT JOIN
    ojt_attendance ON mo_id = oa_ojtid
    where mo_id = '${ojtid}'`;

    console.log(ojtid);

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      res.json({
        msg:'success',
        data: result,
      })
    })
    .catch((error) => {
      res.json({
        msg:'error',
        data: error,
      })
    })
  } catch (error) {
    res.json({
      msg:'error',
      data: error,
    })
  }
});

router.post('/updatepassword', async (req, res) => {
  try {
    let ojtid = req.body.ojtid;
    let currentPass = req.body.currentPass;
    let newPass = req.body.newPass;
    let confirmPass = req.body.confirmPass;

    console.log(ojtid, currentPass, newPass, confirmPass);

    if (newPass !== confirmPass) {
      return res.json({
        msg: 'error',
        description: 'New password and confirm password do not match',
      });
    }

    const userData = await mysql.mysqlQueryPromise(`SELECT ou_password FROM ojt_user WHERE ou_ojtid = '${ojtid}'`);

    if (userData.length !== 1) {
      return res.json({
        msg: 'error',
        description: 'Employee not found',
      });
    }

    const encryptedStoredPassword = userData[0].ou_password;

    Decrypter(encryptedStoredPassword, async (decryptError, decryptedStoredPassword) => {
      if (decryptError) {
        return res.json({
          msg: 'error',
          description: 'Error decrypting the stored password',
        });
      }

      
      if (currentPass !== decryptedStoredPassword) {
        return res.json({
          msg: 'error',
          description: 'Current password is incorrect',
        });
      }


      Encrypter(newPass, async (encryptError, encryptedNewPassword) => {
        if (encryptError) {
          return res.json({
            msg: 'error',
            description: 'Error encrypting the new password',
          });
        }

        await mysql.Update(`UPDATE ojt_user SET ou_password = '${encryptedNewPassword}' WHERE ou_ojtid = '${ojtid}'`);

        return res.json({
          msg: 'success',
          description: 'Password updated successfully',
        });
      });
    });
  } catch (error) {
    console.error(error);
    return res.json({
      msg: 'error',
      description: error.message || 'Internal server error',
    });
  }
});