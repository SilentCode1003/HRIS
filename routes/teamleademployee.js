const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { ValidatorForTeamLead } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  ValidatorForTeamLead(req, res, "teamleademployeelayout", "teamleademployee");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = ` 
      SELECT 
      me_id as newEmployeeId,
      CONCAT(master_employee.me_lastname, " ", master_employee.me_firstname) AS firstname,
      me_phone as phone,
      me_email as email,
      me_jobstatus as jobstatus,
      md_departmentname AS me_department,
      mp_positionname AS me_position
      FROM
      master_employee
      LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
      LEFT JOIN master_position ON master_employee.me_position = mp_positionid
      WHERE me_department = '${departmentid}'
      AND
      me_jobstatus IN ('regular', 'probitionary','apprentice')`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
});
