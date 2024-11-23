const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Encrypter, Decrypter } = require("./repository/cryptography");
var router = express.Router();
const currentDate = moment();
const bcrypt = require("bcrypt");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('settingslayout', { title: 'Express' });

  Validator(req, res, "eportalsettingslayout", "eportalsettings");
});

module.exports = router;

router.post("/getsettingsaccount", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT
    me.me_profile_pic as profilePicturePath, 
    me.me_id as employeeid,
    mu.mu_username as username,
    me.me_firstname as firstname,
    me.me_lastname as lastname,
    me.me_civilstatus as civilstatus,
    me.me_jobstatus as jobstatus,
    me.me_email as email,
    me.me_address as address
    FROM 
    master_employee me
    LEFT JOIN
    master_user mu ON me.me_id = mu.mu_employeeid
    where me_id = '${employeeid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        return res.json({
          msg: error,
        });
      });
  } catch (error) {
    console.error("Error: ", error);
    res.json({
      msg: "error",
      data: null,
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
