const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonWarningResponse,
  MessageStatus,
  JsonSuccess,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const { SendEmailNotification } = require("./repository/emailsender");
var router = express.Router();
const currentDate = moment();
const { REQUEST } = require("./repository/enums");
const e = require("express");
const { SelectStatement } = require("./repository/customhelper");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalrequestleavelayout', { title: 'Express' });
  Validator(
    req,
    res,
    "eportalrequestattendancelayout",
    "eportalrequestattendance"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT 
    ar_requestid,
    DATE_FORMAT(ar_attendace_date, '%Y-%m-%d, %W') as ar_attendace_date,
    DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
    DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
    ar_total,
    ar_createdate,
    ar_status,
    ar_reason
  FROM attendance_request
  INNER JOIN
  master_employee ON attendance_request.ar_employeeid = me_id
  where ar_employeeid ='${employeeid}'
  AND ar_status = 'Pending'`;

    mysql.Select(sql, "Attendance_Request", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/submit", async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let attendancedate = req.body.attendancedate;
    let timein = req.body.timein;
    let timeout = req.body.timeout;
    let subgroupid = req.body.subgroupid;
    let reason = req.body.reason;
    let file = req.body.file;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    let status = "Pending";
    let createby = "On Process";
    let approvedcount = "0";

    let total = calculateTotalHours(timein, timeout);

    const Datenow = new Date();
    const inputDate = new Date(attendancedate);
    if (inputDate > Datenow) {
      return res.json({
        msg: "nodate",
        data: "Date is in the future",
      });
    }

    const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
    const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

    if (employeeResult.length === 0) {
      return res.json({ msg: "Invalid employee ID" });
    }

    const data = [
      [
        employeeid,
        attendancedate,
        timein,
        timeout,
        total,
        subgroupid,
        reason,
        file,
        createdate,
        createby,
        status,
        approvedcount,
      ],
    ];

    let checkStatement = SelectStatement(
      "SELECT * FROM attendance_request WHERE ar_employeeid =? and ar_attendace_date= ? and ar_status =?",
      [employeeid, attendancedate, "Pending"]
    );

    Check(checkStatement).then((result) => {
      if (result != 0) {
        return res.json(JsonWarningResponse(MessageStatus.EXIST));
      } else {
        mysql
          .InsertTable(
            "attendance_request",
            data,
            (insertErr, insertResult) => {
              console.log(insertResult,'result');
              if (insertErr) {
                console.error("Error inserting leave record: ", insertErr);
                res.json({ msg: "insert_failed" });
              } else {
                let emailbody = [
                  {
                    employeename: employeeid,
                    date: attendancedate,
                    timein: timein,
                    timeout: timeout,
                    reason: reason,
                    status: status,
                    requesttype: REQUEST.COA,
                  },
                ];
                SendEmailNotification(
                  employeeid,
                  subgroupid,
                  REQUEST.COA,
                  emailbody
                );

                res.json({ msg: "success" });
              }
            }
          )
      }
    })
    .catch((error) => {
      console.error(error);
      res.json(JsonErrorResponse(error));
    });
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getreqCOA", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let requestid = req.body.requestid;
    let sql = `    
    SELECT 
    DATE_FORMAT(ar_attendace_date, '%Y-%m-%d') as ar_attendace_date,
    DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
    DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
    ar_status,
    ar_reason,
    ar_file
    FROM attendance_request
    WHERE ar_employeeid='${employeeid}' AND ar_requestid = '${requestid}'
    ORDER BY ar_requestid DESC`;

    mysql.Select(sql, "Attendance_Request", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/update", (req, res) => {
  try {
    let requestid = req.body.requestid;
    let attendancedate = req.body.attendancedate;
    let timein = req.body.timein;
    let timeout = req.body.timeout;
    let reason = req.body.reason;
    let requeststatus = req.body.requeststatus;
    let total = calculateTotalHours(timein, timeout);
    let file = req.body.file;

    async function ProcessData() {
      let sql_check = SelectStatement('SELECT ar_employeeid as employeeid, ar_subgroupid as subgroupid FROM attendance_request WHERE ar_requestid = ?', [requestid]);
      let attendance_request = await Check(sql_check);

      if(attendance_request.length != 0){

        let employeeid = attendance_request[0].employeeid;

        let subgroupid = attendance_request[0].subgroupid;

        let sqlupdate = `UPDATE attendance_request SET 
        ar_attendace_date = '${attendancedate}', 
        ar_timein = '${timein}',
        ar_timeout = '${timeout}', 
        ar_reason = '${reason}',
        ar_total = '${total}', 
        ar_status = '${requeststatus}',
        ar_file  = '${file}'
        WHERE ar_requestid = '${requestid}'`;
        

        let updateResult = await mysql.Update(sqlupdate);

        let emailbody = [
          {
            employeename: employeeid,
            date: attendancedate,
            timein: timein,
            timeout: timeout,
            reason: reason,
            status: requeststatus,
            requesttype: REQUEST.COA,
          },
        ];
        SendEmailNotification(
          employeeid,
          subgroupid,
          REQUEST.COA,
          emailbody
        );

        res.json(JsonDataResponse(updateResult));

      }
      else{
        return res.json(JsonWarningResponse(MessageStatus.NOTEXIST));
      }
    }

      ProcessData();
  } catch (error) {
    res.json({
      msg: "error",
    });
  }
});

router.get("/loadapproved", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT 
    ar_requestid,
    DATE_FORMAT(ar_attendace_date, '%Y-%m-%d, %W') as ar_attendace_date,
    DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
    DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
    ar_total,
    ar_createdate,
    ar_status,
    ar_reason
  FROM attendance_request
  INNER JOIN
  master_employee ON attendance_request.ar_employeeid = me_id
  WHERE ar_employeeid ='${employeeid}'
  AND ar_status = 'Approved'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }
      if (result != 0) {
        let data = DataModeling(result, "ar_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});

router.get("/loadrejected", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT 
    ar_requestid,
    DATE_FORMAT(ar_attendace_date, '%Y-%m-%d, %W') as ar_attendace_date,
    DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
    DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
    ar_total,
    ar_createdate,
    ar_status,
    ar_reason
  FROM attendance_request
  INNER JOIN
  master_employee ON attendance_request.ar_employeeid = me_id
  WHERE ar_employeeid ='${employeeid}'
  AND ar_status = 'Rejected'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ar_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});

router.get("/loadcancelled", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT 
    ar_requestid,
    DATE_FORMAT(ar_attendace_date, '%Y-%m-%d, %W') as ar_attendace_date,
    DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
    DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
    ar_total,
    ar_createdate,
    ar_status,
    ar_reason
  FROM attendance_request
  INNER JOIN
  master_employee ON attendance_request.ar_employeeid = me_id
  WHERE ar_employeeid ='${employeeid}'
  AND ar_status = 'Cancel'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ar_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
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

function calculateTotalHours(timein, timeout) {
  const datetimeIn = new Date(timein);
  const datetimeOut = new Date(timeout);
  const timeDifferenceMs = datetimeOut - datetimeIn;
  const totalHoursDecimal = timeDifferenceMs / (1000 * 60 * 60);
  return totalHoursDecimal.toFixed(2);
}
//#endregion
