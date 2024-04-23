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


  router.post("/update", async (req, res) => {
    try {
      let userid = req.body.userid;
      let username = req.body.username;
      //let password = req.body.password;
      //let accesstype = req.body.accesstype;
      let status = req.body.status;
  
      // Wrap the Encrypter function in a promise
      // const encrypted = await new Promise((resolve, reject) => {
      //   Encrypter(password, (err, result) => {
      //     if (err) {
      //       console.error("Error in Encrypter: ", err);
      //       reject(err);
      //     } else {
      //       resolve(result);
      //     }
      //   });
      // });
  
      let sqlupdate = `UPDATE ojt_user SET 
      ou_username = '${username}',
      ou_status ='${status}'
      WHERE ou_userid ='${userid}'`;
  
      const updateResult = await mysql.Update(sqlupdate);
  
      console.log(updateResult);
  
      res.json({
        msg: "success",
      });
    } catch (error) {
      console.error("Error: ", error);
      res.json({
        msg: "error",
      });
    }
  });

  router.post("/getusers", (req, res) => {
    try {
      let userid = req.body.userid;
      let sql = `
      SELECT 
      ou_username,
      ou_accesstype,
      ou_status
      from ojt_user
      where ou_userid = '${userid}'`;
  
      mysql.Select(sql, "Ojt_User", (err, result) => {
        if (err) console.error("Error: ", err);
  
        res.json({
          msg: "success",
          data: result,
        });
      });
    } catch (error) {
      res.status(500).json({
        msg: "Internal server error",
        error: error,
      });
    }
  });
  
  