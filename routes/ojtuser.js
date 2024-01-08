const mysql = require('./repository/hrmisdb');
const moment = require('moment');
var express = require('express');
const { Validator } = require('./controller/middleware');
const { Encrypter } = require('./repository/crytography');
const { generateUsernameAndPasswordforOjt } = require("./helper");
var router = express.Router();
const currentDate = moment();

const currentYear = moment().format("YYYY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('ojtuserlayout', { title: 'Express' });
  Validator(req, res, 'ojtuserlayout');
});

module.exports = router;

router.get('/load', (req, res) => {
    try {
      let sql = `SELECT 
      ou_userid,
      concat(mo_lastname,' ',mo_name) as ou_ojtid,
      ou_username,
      ma_accessname as ou_accesstype,
      ou_status
      from ojt_user
        left join master_ojt on ojt_user.ou_ojtid = mo_id
      LEFT JOIN master_access ON ojt_user.ou_accesstype = ma_accessid`;
  
      mysql.Select(sql, 'Ojt_User', (err, result) => {
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
  