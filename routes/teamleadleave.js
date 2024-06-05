const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { ValidatorForTeamLead } = require("./controller/middleware");
const { Select } = require("./repository/dbconnect");
const { JsonErrorResponse, JsonDataResponse } = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  ValidatorForTeamLead(req, res, "teamleadleavelayout", "teamleadleave");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `SELECT 
    l_leaveid, 
    CONCAT(master_employee.me_firstname, " ", master_employee.me_lastname) AS l_employeeid,
    l_leavestartdate,
    l_leaveenddate,
    ml_leavetype as l_leavetype,
    l_leavereason,
    l_leavestatus,
    l_leaveapplieddate
    FROM leaves 
    JOIN master_employee 
    ON leaves.l_employeeid = master_employee.me_id
     INNER JOIN master_leaves ON leaves.l_leavetype = ml_id
    WHERE me_department = '${departmentid}'
    AND l_employeeid NOT IN (
      SELECT tu_employeeid FROM teamlead_user
    );`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      console.log(result);

      if (result != 0) {
        let data = DataModeling(result, "l_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});
