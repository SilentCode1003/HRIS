const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
// const { decrypt } = require("dotenv");
const { Decrypter, Encrypter } = require("./repository/crytography");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('settingslayout', { title: 'Express' });

  Validator(req, res, 'eportalsettingslayout');
});

module.exports = router;

router.post('/getsettingsaccount', (req, res) => {
  try {
   let employeeid = req.session.employeeid;
   let sql =`SELECT
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

   mysql.mysqlQueryPromise(sql)
   .then((result) => {
    console.log(result);

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

router.post('/updatepassword', async (req, res) => {
  try {
    // Check if the user is authenticated (using a session)
    const employeeIdFromSession = req.session.employeeid;

    if (!employeeIdFromSession) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Retrieve the current password and new password from the request
    const { currentPass, newPass } = req.body;

    // Retrieve user data based on the session employee_id
    const user = Object.values(masterUserData).find(user => user.mu_employeeid === employeeIdFromSession);

    if (!user) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if the current password is correct
    const decryptedCurrentPass = await Decrypter(user.mu_password);

    if (decryptedCurrentPass !== currentPass) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Encrypt the new password before updating
    const encryptedNewPass = await Encrypter(newPass);

    // Update the password in the mock data (you should update it in your database)
    user.mu_password = encryptedNewPass;

    // Simulate a successful response
    return res.json({ message: "Password updated successfully", employeeid: employeeIdFromSession });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;