var express = require("express");
const {
  JsonErrorResponse,
  JsonWarningResponse,
  JsonSuccess,
} = require("./repository/response");
const { SelectStatement } = require("./repository/customhelper");
const { DataModeling } = require("./model/hrmisdb");
const { SendRequestPassword } = require("./repository/emailsender");
const { Select } = require("./repository/dbconnect");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("forgotpasswordlayout", { title: "Express" });
});

module.exports = router;

router.post("/request", (req, res) => {
  try {
    const { employeeid } = req.body;

    let sql = `select  
              me_id,
              concat(me_firstname, ' ', me_lastname) as me_fullname,
              me_email,
              mu_password as me_password
              from master_employee
              inner join master_user on mu_employeeid = me_id
              inner join master_access on ma_accessid = mu_accesstype 
              where me_id = ? 
              and ma_accessname='Employee';
`;
    let cmd = SelectStatement(sql, [employeeid]);

    Select(cmd, (err, result) => {
      if (err) {
        res.status(500).json(JsonErrorResponse(err));
      }

      if (result.length > 0) {
        let data = DataModeling(result, "me_");

        console.log(data);

        SendRequestPassword(employeeid, "Forgot Password", data);

        res.status(200).json(JsonSuccess());
      } else {
        res.status(404).json(JsonErrorResponse("Employee not found"));
      }
    });
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});
