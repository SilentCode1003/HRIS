const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select } = require("./repository/dbconnect");
const { JsonErrorResponse, JsonDataResponse } = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('pendingleavelayout', { title: 'Express' });
  Validator(
    req,
    res,
    "teamleadshiftadjustmentlayout",
    "teamleadshiftadjustment"
  );
});

module.exports = router;




router.get("/load", (req, res) => {
    try {
      let departmentid = req.session.departmentid; 
      let sql = `SELECT 
      cs_id,
      concat(me_lastname,' ',me_firstname) as cs_fullname,
      cs_actualrd,
      cs_changerd,
      cs_createby,
      cs_shiftstatus
      FROM change_shift
      INNER JOIN master_employee on change_shift.cs_employeeid = me_id
      WHERE me_department = '${departmentid}'
      AND cs_employeeid NOT IN (
          SELECT tu_employeeid FROM teamlead_user)`;
  
      Select(sql, (err, result) => {
        if (err) {
          console.error(err);
          res.json(JsonErrorResponse(err));
        }
  
        if (result != 0) {
          let data = DataModeling(result, "cs_");
  
          res.json(JsonDataResponse(data));
        } else {
          res.json(JsonDataResponse(result));
        }
      });
    } catch (error) {
      res.json(JsonErrorResponse(err));
    }
  });