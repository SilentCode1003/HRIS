const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Encrypter } = require("./repository/crytography");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('settingslayout', { title: 'Express' });

  Validator(req, res, "settingslayout", "settings");
});

module.exports = router;

router.post("/update", async (req, res) => {
  try {
    let userid = req.body.userid;
    let username = req.body.username;
    let password = req.body.password;
    let accesstype = req.body.accesstype;
    let status = req.body.status;

    const encrypted = await new Promise((resolve, reject) => {
      Encrypter(password, (err, result) => {
        if (err) {
          console.error("Error in Encrypter: ", err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    let sqlupdate = `UPDATE master_user SET 
      mu_username = '${username}',
      mu_password = '${encrypted}',
      mu_accesstype = '${accesstype}',
      mu_status ='${status}'
      WHERE mu_userid ='${userid}'
      AND mu_username`;

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
