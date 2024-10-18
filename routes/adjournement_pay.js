var express = require("express");
var router = express.Router();

const mysql = require("./repository/hrmisdb");
const moment = require("moment");
const multer = require("multer");
const XLSX = require("xlsx");
const { Validator } = require("./controller/middleware");
const {
  convertExcelDate,
  GetCurrentDatetime,
  GetCurrentDate,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
} = require("./repository/customhelper");
const { Encrypter } = require("./repository/cryptography");
const {
  generateUsernameAndPasswordForApprentice,
} = require("./repository/helper");
const {
  generateUsernameAndPasswordforemployee,
} = require("./repository/helper");
const { GenerateExcel } = require("./repository/excel");
const { Select, InsertTable, Update } = require("./repository/dbconnect");
const { DataModeling, RawData } = require("./model/hrmisdb");
const {
  JsonDataResponse,
  JsonErrorResponse,
  JsonWarningResponse,
  MessageStatus,
  JsonSuccess,
} = require("./repository/response");

const apprenticecurrentYear = moment().format("YYYY");
const currentYear = moment().format("YY");
const currentMonth = moment().format("MM");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('employeelayout', { title: 'Express' });

  Validator(req, res, "adjournement_paylayout", "adjournement_pay");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT
        hsp_id,
        hs_name as hsp_hold_suspensionid,
        CONCAT(me_lastname,' ',me_firstname) as hsp_fullname,
        DATE_FORMAT(hsp_payrolldate, '%Y-%m-%d') as hsp_payrolldate,
        DATE_FORMAT(hsp_lift_date, '%Y-%m-%d') as hsp_lift_date,
        hsp_duration_day,
        hsp_salary_per_day,
        DATE_FORMAT(hsp_payrolldate, '%Y-%m-%d') as hs_payrolldate
        FROM hold_suspension_pay
        INNER JOIN hold_suspension ON hold_suspension_pay.hsp_hold_suspensionid = hs_id
        INNER JOIN master_employee ON hold_suspension_pay.hsp_employeeid = me_id`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "hsp_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getadjournemployee", (req, res) => {
  try {
    let adjournid = req.body.adjournid;
    let sql = `SELECT 
    me_profile_pic AS hs_image,
    hs_employeeid,
    hs_name,
    DATE_FORMAT(hs_startdate, '%Y-%m-%d') AS hs_startdate,
    DATE_FORMAT(hs_enddate, '%Y-%m-%d') AS hs_enddate,
    hs_status,
    hs_description,
    hsp_salary_per_day as hs_salary_per_day,
    hsp_total_suspension_pay as hs_total_suspension_pay,
    DATE_FORMAT(hsp_payrolldate, '%Y-%m-%d') as hs_payrolldate
    FROM hold_suspension_pay
    INNER JOIN hold_suspension ON hsp_hold_suspensionid = hs_id
    INNER JOIN master_employee ON hold_suspension.hs_employeeid = me_id
    WHERE hsp_id = '${adjournid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "hs_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/viewdatesdetails", (req, res) => {
  try {
    let adjournid = req.body.adjournid;
    let sql = `WITH RECURSIVE DateSeries AS (
        SELECT 
            hs.hs_id,
            hs.hs_employeeid,
            hs.hs_startdate AS date_value,
            hs.hs_enddate,
            hsp.hsp_lift_date, -- Now retrieving lift_date from hold_suspension_pay
            hsp.hsp_id, -- Add hsp_id here from hold_suspension_pay
            DAYNAME(hs.hs_startdate) AS day_name
        FROM 
            hold_suspension hs
        JOIN 
            hold_suspension_pay hsp
        ON 
            hs.hs_id = hsp.hsp_hold_suspensionid
        WHERE 
            hsp.hsp_id = '${adjournid}'
        UNION ALL

        SELECT 
            ds.hs_id,
            ds.hs_employeeid,
            DATE_ADD(ds.date_value, INTERVAL 1 DAY) AS date_value,
            ds.hs_enddate,
            ds.hsp_lift_date,
            ds.hsp_id,  -- Include hsp_id in the recursion
            DAYNAME(DATE_ADD(ds.date_value, INTERVAL 1 DAY)) AS day_name
        FROM 
            DateSeries ds
        WHERE 
            ds.date_value < ds.hs_enddate
    )
    SELECT 
        ds.hs_id AS hs_adjournid,  
        ds.hs_employeeid AS hs_employeeid,
        DATE_FORMAT(ds.date_value, '%Y-%m-%d') AS hs_date_value, 
        DAYNAME(ds.date_value) AS hs_day_name,
        CASE 
            WHEN ds.date_value = ds.hsp_lift_date THEN 'Lifted'
            WHEN ds.date_value > ds.hsp_lift_date THEN NULL
            WHEN ds.day_name = 'Monday' AND JSON_UNQUOTE(ms.ms_monday->"$.time_in") = '00:00:00' THEN 'Rest Day'
            WHEN ds.day_name = 'Tuesday' AND JSON_UNQUOTE(ms.ms_tuesday->"$.time_in") = '00:00:00' THEN 'Rest Day'
            WHEN ds.day_name = 'Wednesday' AND JSON_UNQUOTE(ms.ms_wednesday->"$.time_in") = '00:00:00' THEN 'Rest Day'
            WHEN ds.day_name = 'Thursday' AND JSON_UNQUOTE(ms.ms_thursday->"$.time_in") = '00:00:00' THEN 'Rest Day'
            WHEN ds.day_name = 'Friday' AND JSON_UNQUOTE(ms.ms_friday->"$.time_in") = '00:00:00' THEN 'Rest Day'
            WHEN ds.day_name = 'Saturday' AND JSON_UNQUOTE(ms.ms_saturday->"$.time_in") = '00:00:00' THEN 'Rest Day'
            WHEN ds.day_name = 'Sunday' AND JSON_UNQUOTE(ms.ms_sunday->"$.time_in") = '00:00:00' THEN 'Rest Day'        
            ELSE 'Adjourned'
        END AS hs_adjourn_status
    FROM 
        DateSeries ds
    JOIN 
        master_shift ms
    ON 
        ds.hs_employeeid = ms.ms_employeeid
    ORDER BY 
        ds.date_value`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }
      if (result != 0) {
        let data = DataModeling(result, "hs_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.put("/edit", (req, res) => {
  try {
    const { adjournid, payrolldate, employeeid } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (payrolldate) {
      data.push(payrolldate);
      columns.push("payrolldate");
    }

    if (adjournid) {
      data.push(adjournid);
      arguments.push("id");
    }

    let updateStatement = UpdateStatement(
      "hold_suspension_pay",
      "hsp",
      columns,
      arguments
    );

    console.log(updateStatement);

    let checkStatement = SelectStatement(
      "select * from hold_suspension_pay where hsp_employeeid=? and hsp_hold_suspensionid=? and hsp_payrolldate=?",
      [employeeid, adjournid, payrolldate]
    );

    console.log(checkStatement);
    

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);

            console.log(result);

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

//#region FUNCTION
function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}
//#endregion
