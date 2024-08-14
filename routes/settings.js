const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Encrypter, Decrypter } = require("./repository/cryptography");
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

router.post("/updatepassword", async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let currentPass = req.body.currentPass;
    let newPass = req.body.newPass;
    let confirmPass = req.body.confirmPass;
    let accesstypeid = req.session.accesstypeid;

    console.log(employeeid, currentPass, newPass, confirmPass, accesstypeid);

    if (newPass !== confirmPass) {
      return res.json({
        msg: "error",
        description: "New password and confirm password do not match",
      });
    }

    const userData = await mysql.mysqlQueryPromise(
      `SELECT mu_password FROM master_user WHERE 
      mu_accesstype = '${accesstypeid}' and  mu_employeeid = '${employeeid}'`
    );

    if (userData.length !== 1) {
      return res.json({
        msg: "error",
        description: "Employee not found",
      });
    }

    const encryptedStoredPassword = userData[0].mu_password;

    Decrypter(
      encryptedStoredPassword,
      async (decryptError, decryptedStoredPassword) => {
        if (decryptError) {
          return res.json({
            msg: "error",
            description: "Error decrypting the stored password",
          });
        }

        if (currentPass !== decryptedStoredPassword) {
          return res.json({
            msg: "error",
            description: "Current password is incorrect",
          });
        }

        Encrypter(newPass, async (encryptError, encryptedNewPassword) => {
          if (encryptError) {
            return res.json({
              msg: "error",
              description: "Error encrypting the new password",
            });
          }

          await mysql.Update(
            `UPDATE master_user SET mu_password = '${encryptedNewPassword}' WHERE mu_employeeid = '${employeeid}' and mu_accesstype = '${accesstypeid}'`
          );

          return res.json({
            msg: "success",
            description: "Password updated successfully",
          });
        });
      }
    );
  } catch (error) {
    console.error(error);
    return res.json({
      msg: "error",
      description: error.message || "Internal server error",
    });
  }
});
