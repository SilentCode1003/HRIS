const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, Update, InsertTable } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
var router = express.Router();
const currentDate = moment();
const {
  GetCurrentMonthFirstDay,
  GetCurrentMonthLastDay,
  UpdateStatement,
  GetCurrentDatetime,
  InsertStatement,
} = require("./repository/customhelper");
const { log } = require("winston");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(req, res, "manual_regholidaylayout", "manual_regholiday");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
      gp_id,
      CONCAT(me_lastname,' ',me_firstname) AS gp_fullname,
      mh_name as gp_holiday_name,
      DATE_FORMAT(gp_attendancedate, '%Y-%m-%d') as gp_attendancedate,
      gp_payrolldate
    FROM generate_payroll
    INNER JOIN master_holiday ON generate_payroll.gp_attendancedate = mh_date
    INNER JOIN master_employee ON generate_payroll.gp_employeeid = me_id
    INNER JOIN master_salary ON master_employee.me_id = ms_employeeid
    WHERE gp_attendancedate = mh_date 
    AND mh_type = 'Regular Holiday'
    AND ms_payrolltype = 'Daily'
    AND gp_status = 0
    AND YEAR(gp_attendancedate) = YEAR(CURDATE())
    AND MONTH(gp_attendancedate) = MONTH(CURDATE())`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "gp_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getotherpayroll", (req, res) => {
  try {
    let year = req.body.year;
    let month = req.body.month;

    let sql = `SELECT 
      gp_id,
      CONCAT(me_lastname,' ',me_firstname) AS gp_fullname,
      mh_name as gp_holiday_name,
      DATE_FORMAT(gp_attendancedate, '%Y-%m-%d') as gp_attendancedate,
      gp_payrolldate
      FROM generate_payroll
    INNER JOIN master_holiday ON generate_payroll.gp_attendancedate = mh_date
    INNER JOIN master_employee ON generate_payroll.gp_employeeid = me_id
    INNER JOIN master_salary ON master_employee.me_id = ms_employeeid
    WHERE gp_attendancedate = mh_date 
    AND mh_type = 'Regular Holiday'
    AND ms_payrolltype = 'Daily'
    AND gp_status = 0
    AND YEAR(gp_attendancedate) = '${year}'
    AND MONTH(gp_attendancedate) = '${month}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "gp_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/updategpstatus", (req, res) => {
  try {
    let createddate = GetCurrentDatetime();
    let createby = req.session.fullname;
    const records = req.body; 

    let gpstatus = 1;
    
    records.forEach(record => {
      const { gpid, fullname, holidayname, attendancedate, payrolldate } = record;

      let data = [];
      let columns = [];
      let arguments = [];

      if (gpstatus) {
        data.push(gpstatus);
        columns.push("status");
      }

      if (gpid) {
        data.push(gpid);
        arguments.push("id");
      }

      let updateStatement = UpdateStatement(
        "generate_payroll",
        "gp",
        columns,
        arguments
      );
      
      Update(updateStatement, data, (err, result) => {
        if (err) {
          console.error("Error during Update: ", err);
          return res.json(JsonErrorResponse(err));
        }

        let sql = InsertStatement("manual_holiday_history", "mhh", [
          "employee",
          "gp_id",
          "holiday_name",
          "attendance_date",
          "payroll_date",
          "create_date",
          "create_by",
        ]);
        
        let insertData = [
          [
            fullname,
            gpid,
            holidayname,
            attendancedate,
            payrolldate,
            createddate,
            createby,
          ],
        ];

        InsertTable(sql, insertData, (err, result) => {
          if (err) {
            console.error("Error during Insert: ", err);
            return res.json(JsonErrorResponse(err));
          }
          
          if (records.indexOf(record) === records.length - 1) {
            res.json(JsonSuccess());
          }
        });
      });
    });
  } catch (error) {
    console.error("Error in catch block: ", error);
    res.json(JsonErrorResponse(error));
  }
});


router.get("/loadhistory", (req, res) => {
  try {
    let sql = `SELECT
      mhh_history_id,
      mhh_employee,
      mhh_holiday_name,
      DATE_FORMAT(mhh_attendance_date, '%Y-%m-%d') as mhh_attendance_date,
      DATE_FORMAT(mhh_payroll_date, '%Y-%m-%d') as mhh_payroll_date,
      DATE_FORMAT(mhh_create_date, '%Y-%m-%d') as mhh_create_date,
      mhh_create_by 
      FROM manual_holiday_history
	    WHERE YEAR(mhh_attendance_date) = YEAR(CURDATE())
      AND MONTH(mhh_attendance_date) = MONTH(CURDATE())`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mhh_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/loadhistoryfilter", (req, res) => {
  try {
    let year = req.body.year;
    let month = req.body.month;
    let sql = `SELECT
      mhh_history_id,
      mhh_employee,
      mhh_holiday_name,
      DATE_FORMAT(mhh_attendance_date, '%Y-%m-%d') as mhh_attendance_date,
      DATE_FORMAT(mhh_payroll_date, '%Y-%m-%d') as mhh_payroll_date,
      DATE_FORMAT(mhh_create_date, '%Y-%m-%d') as mhh_create_date,
      mhh_create_by 
      FROM manual_holiday_history
	    WHERE YEAR(mhh_attendance_date) = '${year}'
      AND MONTH(mhh_attendance_date) = '${month}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mhh_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});