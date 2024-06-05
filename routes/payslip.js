const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, InsertTable, Update } = require("./repository/dbconnect");
const { JsonErrorResponse, JsonDataResponse, MessageStatus, JsonSuccess, JsonWarningResponse } = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const { SelectStatement, InsertStatement, UpdateStatement } = require("./repository/customhelper");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('govermentidlayout', { title: 'Express' });
  Validator(req, res, "paysliplayout", "payslip");
});

module.exports = router;


router.get("/load", (req, res) => {
  try {
    let sql = `  
    SELECT 
    DATE_FORMAT(gp.gp_payrolldate, '%Y-%m-%d') AS gp_payrolldate,
    CONCAT(gp.gp_startdate, ' To ', gp.gp_enddate) AS gp_daterange,
    SUM(gp.gp_total_hours) as gp_totalhours,
    SUM(gp.gp_night_differentials) as gp_nightdiffhours,
    SUM(gp.gp_normal_ot) as gp_normal_ot,
    SUM(gp.gp_early_ot) as gp_earlyot,
    SEC_TO_TIME(SUM(TIME_TO_SEC(COALESCE(gp.gp_late, '00:00:00')))) AS gp_late_minutes
    FROM 
        generate_payroll gp
    LEFT JOIN 
        payslip ps ON gp.gp_payrolldate = ps.p_payrolldate
    WHERE 
        ps.p_payrolldate IS NULL
    GROUP BY 
        gp.gp_payrolldate, gp.gp_startdate, gp.gp_enddate
    ORDER BY 
        gp.gp_payrolldate DESC;
    `;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      console.log(result,'result');

      if (result != 0) {
        let data = DataModeling(result, "gp_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});



router.post("/approvepayslip", (req, res) => {
  try {
    let payrolldate = req.body.payrolldate;
    let sql = `call hrmis.ApprovePayslip('${payrolldate}')`;

    mysql.StoredProcedure(sql, (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});
