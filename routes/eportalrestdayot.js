const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, Update, InsertTable } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  MessageStatus,
  JsonWarningResponse,
  JsonSuccess,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const e = require("express");
const {
  UpdateStatement,
  SelectStatement,
  GetCurrentDatetime,
  InsertStatement,
} = require("./repository/customhelper");
const { SendEmailNotification } = require("./repository/emailsender");
const { REQUEST } = require("./repository/enums");
const { sub } = require("date-fns");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalrequestovertimelayout', { title: 'Express' });
  Validator(req, res, "eportalrestdayotlayout", "eportalrestdayot");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `
        SELECT 
            roa_rdotid,
            DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
            DAYNAME(roa_attendancedate) AS roa_dayname,
            DATE_FORMAT(roa_timein, '%H:%i:%s') AS roa_timein,
            DATE_FORMAT(roa_timeout, '%H:%i:%s') AS roa_timeout,
            roa_total_hours,
            roa_status,
            DATE_FORMAT(roa_createdate, '%Y-%m-%d %H:%i:%s') AS roa_createdate
        FROM restday_ot_approval
        WHERE roa_employeeid = '${employeeid}'
        AND roa_status = 'Pending'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "roa_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.get("/loadapproved", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `
        SELECT 
            roa_rdotid,
            DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
            DAYNAME(roa_attendancedate) AS roa_dayname,
            DATE_FORMAT(roa_timein, '%H:%i:%s') AS roa_timein,
            DATE_FORMAT(roa_timeout, '%H:%i:%s') AS roa_timeout,
            roa_total_hours,
            roa_status,
            DATE_FORMAT(roa_createdate, '%Y-%m-%d %H:%i:%s') AS roa_createdate,
            DATE_FORMAT(roa_payrolldate, '%Y-%m-%d') AS roa_payrolldate,
            roa_subgroupid
        FROM restday_ot_approval
        WHERE roa_employeeid = '${employeeid}'
        AND roa_status = 'Approved'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "roa_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.get("/loadapplied", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `
        SELECT 
            roa_rdotid,
            DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
            DAYNAME(roa_attendancedate) AS roa_dayname,
            DATE_FORMAT(roa_timein, '%H:%i:%s') AS roa_timein,
            DATE_FORMAT(roa_timeout, '%H:%i:%s') AS roa_timeout,
            roa_total_hours,
            roa_status,
            DATE_FORMAT(roa_createdate, '%Y-%m-%d %H:%i:%s') AS roa_createdate,
            DATE_FORMAT(roa_payrolldate, '%Y-%m-%d') AS roa_payrolldate,
            roa_subgroupid
        FROM restday_ot_approval
        WHERE roa_employeeid = '${employeeid}'
        AND roa_status = 'Applied'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "roa_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.get("/loadrejected", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `
        SELECT 
            roa_rdotid,
            DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
            DAYNAME(roa_attendancedate) AS roa_dayname,
            DATE_FORMAT(roa_timein, '%H:%i:%s') AS roa_timein,
            DATE_FORMAT(roa_timeout, '%H:%i:%s') AS roa_timeout,
            roa_total_hours,
            roa_status,
            DATE_FORMAT(roa_createdate, '%Y-%m-%d %H:%i:%s') AS roa_createdate,
            DATE_FORMAT(roa_payrolldate, '%Y-%m-%d') AS roa_payrolldate,
            roa_subgroupid
        FROM restday_ot_approval
        WHERE roa_employeeid = '${employeeid}'
        AND roa_status = 'Rejected'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "roa_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.get("/loadcancelled", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `
        SELECT 
            roa_rdotid,
            DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
            DAYNAME(roa_attendancedate) AS roa_dayname,
            DATE_FORMAT(roa_timein, '%H:%i:%s') AS roa_timein,
            DATE_FORMAT(roa_timeout, '%H:%i:%s') AS roa_timeout,
            roa_total_hours,
            roa_status,
            DATE_FORMAT(roa_createdate, '%Y-%m-%d %H:%i:%s') AS roa_createdate,
            DATE_FORMAT(roa_payrolldate, '%Y-%m-%d') AS roa_payrolldate,
            roa_subgroupid
        FROM restday_ot_approval
        WHERE roa_employeeid = '${employeeid}'
        AND roa_status = 'Cancelled'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "roa_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getrestdayot", (req, res) => {
  try {
    let rdotid = req.body.rdotid;
    let sql = `SELECT
        roa_rdotid,
        DATE_FORMAT(roa_timein, '%Y-%m-%d %H:%i:%s') AS roa_timein,
        DATE_FORMAT(roa_timeout, '%Y-%m-%d %H:%i:%s') AS roa_timeout,
        DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
        DAYNAME(roa_attendancedate) AS roa_dayname,
        roa_status,
        roa_total_hours,
        roa_file,
        roa_admin_comment,
          (
          SELECT rra_comment 
          FROM restdayot_request_activity 
          WHERE rra_restdayotid = roa_rdotid
          ORDER BY rra_date DESC
          LIMIT 1
        ) AS roa_comment,
        DATE_FORMAT(roa_payrolldate, '%Y-%m-%d') AS roa_payrolldate,
        roa_subgroupid
        FROM restday_ot_approval
        WHERE roa_rdotid = '${rdotid}'
        LIMIT 1`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "roa_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});


router.post("/save", (req, res) => {
  try {
    let {
      timein,
      timeout,
      attendancedate,
      employeeid,
      payrolldate,
      reason,
      subgroup,
      file,
      shiftTimeIn,
      shiftTimeOut,
    } = req.body;
    let status = "Applied";
    let approvecount = 0;

    console.log(req.body);
    

    let applieddate = GetCurrentDatetime();
    let sql = `CALL hrmis.RequestRestDayOt(
      '${timein}',
      '${timeout}',
      '${shiftTimeIn}',
      '${shiftTimeOut}',
      '${attendancedate}',
      '${employeeid}',
      '${payrolldate}',
      '${status}',
      '${subgroup}',
      '${file}',
      '${applieddate}',
      '${approvecount}'
    )`;

    let validationQuery1 = SelectStatement(
      `SELECT 1 FROM restday_ot_approval WHERE roa_attendancedate = ? AND roa_employeeid = ? AND roa_status = 'Pending'`,
      [attendancedate, employeeid]
    );

    let validationQuery2 = SelectStatement(
      `SELECT 1 FROM restday_ot_approval WHERE roa_attendancedate = ? AND roa_employeeid = ? AND roa_status = 'Applied'`,
      [attendancedate, employeeid]
    );

    let validationQuery3 = SelectStatement(
      `SELECT 1 FROM restday_ot_approval WHERE roa_attendancedate = ? AND roa_employeeid = ? AND roa_status = 'Approved'`,
      [attendancedate, employeeid]
    );

    Check(validationQuery1)
      .then((result1) => {
        if (result1.length > 0) {
          return Promise.reject(
            JsonWarningResponse(MessageStatus.EXIST, MessageStatus.PENDINGRDOT)
          );
        }
        return Check(validationQuery2);
      })
      .then((result2) => {
        if (result2.length > 0) {
          return Promise.reject(JsonWarningResponse(MessageStatus.EXIST,MessageStatus.APPLIEDRDOT));
        }
        return Check(validationQuery3);
      })
      .then((result3) => {
        if (result3.length > 0) {
          return Promise.reject(JsonWarningResponse(MessageStatus.EXIST,MessageStatus.APPROVEDRDOT));
        }
        mysql.StoredProcedure(sql, (err, insertResult) => {
          if (err) {
            console.error(err);
            return res.json(JsonErrorResponse(err));
          } else {
            console.log(insertResult);

            let emailbody = [
              {
                employeename: employeeid,
                date: attendancedate,
                reason: reason,
                status: MessageStatus.APPLIED,
                requesttype: REQUEST.RD,
                startdate: timein,
                enddate: timeout,
              },
            ];

            SendEmailNotification(employeeid, subgroup, REQUEST.RD, emailbody);

            return res.json(JsonSuccess());
          }
        });
      })
      .catch((error) => {
        console.log(error);
        return res.json(error);
      });
  } catch (error) {
    console.log(error);
    return res.json(JsonErrorResponse(error));
  }
});


router.put("/edit", (req, res) => {
  try {
    let createddate = GetCurrentDatetime();
    let approvecount = 0;

    const {
      rdotid,
      status,
      clockin,
      clockout,
      shiftTimeIn,
      shiftTimeOut,
      attendancedate,
      payrolldate,
      subgroup,
      file,
      employeeid,
    } = req.body;

    console.log(req.body);
    let sql = `call hrmis.UpdateRequestRestDayOt(
      '${clockin}',
      '${clockout}',
      '${shiftTimeIn}',
      '${shiftTimeOut}',
      '${attendancedate}',
      '${employeeid}',
      '${payrolldate}',
      '${status}',
      '${subgroup}',
      '${file}',
      '${createddate}',
      '${approvecount}',
      '${rdotid}'
    )`;

    let validationQuery2 = SelectStatement(
      `SELECT 1 FROM restday_ot_approval WHERE roa_attendancedate = ? AND roa_employeeid = ? AND roa_status = 'Applied'`,
      [attendancedate, employeeid]
    );

    let validationQuery3 = SelectStatement(
      `SELECT 1 FROM restday_ot_approval WHERE roa_attendancedate = ? AND roa_employeeid = ? AND roa_status = 'Approved'`,
      [attendancedate, employeeid]
    );

    Check(validationQuery2)
      .then((result1) => {
        if (result1.length > 0) {
          return Promise.reject(
            JsonWarningResponse(MessageStatus.EXIST, MessageStatus.APPLIEDRDOT)
          );
        }
        return Check(validationQuery3);
      })
      .then((result2) => {
        if (result2.length > 0) {
          return Promise.reject(
            JsonWarningResponse(MessageStatus.EXIST, MessageStatus.APPROVEDRDOT)
          );
        }
        mysql.StoredProcedure(sql, (err, insertResult) => {
          if (err) {
            console.error(err);
            return res.json(JsonErrorResponse(err));
          } else {
            console.log(insertResult);
            let emailbody = [
              {
                employeename: employeeid,
                date: createddate,
                startdate: clockin,
                enddate: clockout,
                reason: status,
                status: status,
                requesttype: REQUEST.HD,
              },
            ];
            SendEmailNotification(employeeid, subgroup, REQUEST.HD, emailbody);

            //res.json(JsonSuccess());
            return res.json(JsonSuccess());
          }
        });
      })
      .catch((error) => {
        console.log(error);
        return res.json(error);
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
