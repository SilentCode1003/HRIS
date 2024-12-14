const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select } = require("./repository/dbconnect");
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
  SelectStatement,
  GetCurrentDatetime,
} = require("./repository/customhelper");
const { sq } = require("date-fns/locale");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "eportalrequestovertimelayout", "eportalrequestovertime");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT
    pao_id,
    DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS pao_attendancedate,
    DATE_FORMAT(pao_clockin, '%d %M %Y, %h:%i %p') AS pao_clockin,
    DATE_FORMAT(pao_clockout, '%d %M %Y, %h:%i %p') AS pao_clockout,
    pao_total_hours,
    pao_early_ot,
    pao_normal_ot,
    pao_night_differentials,
    pao_payroll_date,
    pao_status
    FROM payroll_approval_ot
    WHERE pao_employeeid = '${employeeid}'
    AND pao_status = 'Pending'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pao_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.get("/loadapproved", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT
      pao_id,
      DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS pao_attendancedate,
      DATE_FORMAT(pao_clockin, '%d %M %Y, %h:%i %p') AS pao_clockin,
      DATE_FORMAT(pao_clockout, '%d %M %Y, %h:%i %p') AS pao_clockout,
      pao_total_hours,
      pao_early_ot,
      pao_normal_ot,
      pao_night_differentials,
      DATE_FORMAT(pao_payroll_date, '%W, %Y-%m-%d') AS pao_payroll_date,
      pao_status
      FROM payroll_approval_ot
      WHERE pao_employeeid = '${employeeid}'
      AND pao_status = 'Approved'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pao_");

        console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.get("/loadapplied", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT
        pao_id,
        DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS pao_attendancedate,
        DATE_FORMAT(pao_clockin, '%d %M %Y, %h:%i %p') AS pao_clockin,
        DATE_FORMAT(pao_clockout, '%d %M %Y, %h:%i %p') AS pao_clockout,
        pao_total_hours,
        pao_early_ot,
        pao_normal_ot,
        pao_night_differentials,
        DATE_FORMAT(pao_payroll_date, '%W, %Y-%m-%d') AS pao_payroll_date,
        pao_status
        FROM payroll_approval_ot
        WHERE pao_employeeid = '${employeeid}'
        AND pao_status = 'Applied'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pao_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.get("/loadrejected", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT
        pao_id,
        DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS pao_attendancedate,
        DATE_FORMAT(pao_clockin, '%d %M %Y, %h:%i %p') AS pao_clockin,
        DATE_FORMAT(pao_clockout, '%d %M %Y, %h:%i %p') AS pao_clockout,
        pao_total_hours,
        pao_early_ot,
        pao_normal_ot,
        pao_night_differentials,
        DATE_FORMAT(pao_payroll_date, '%W, %Y-%m-%d') AS pao_payroll_date,
        pao_status
        FROM payroll_approval_ot
        WHERE pao_employeeid = '${employeeid}'
        AND pao_status = 'Rejected'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pao_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.get("/loadcancelled", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT
        pao_id,
        DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS pao_attendancedate,
        DATE_FORMAT(pao_clockin, '%d %M %Y, %h:%i %p') AS pao_clockin,
        DATE_FORMAT(pao_clockout, '%d %M %Y, %h:%i %p') AS pao_clockout,
        pao_total_hours,
        pao_early_ot,
        pao_normal_ot,
        pao_night_differentials,
        DATE_FORMAT(pao_payroll_date, '%W, %Y-%m-%d') AS pao_payroll_date,
        pao_status
        FROM payroll_approval_ot
        WHERE pao_employeeid = '${employeeid}'
        AND pao_status = 'Cancel'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "pao_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});

router.post("/getovertime", (req, res) => {
  try {
    let approveot_id = req.body.approveot_id;
    let sql = `SELECT
        pao_id AS approvalid,
        CASE 
            WHEN mh_date IS NOT NULL THEN mh_type
            WHEN (
                JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Monday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Tuesday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Wednesday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Thursday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Friday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Saturday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Sunday'
            )
            THEN 'Rest Day'
            ELSE TIME_FORMAT(
                JSON_UNQUOTE(JSON_EXTRACT(
                    CASE DAYNAME(pao_attendancedate)
                        WHEN 'Monday' THEN ms_monday
                        WHEN 'Tuesday' THEN ms_tuesday
                        WHEN 'Wednesday' THEN ms_wednesday
                        WHEN 'Thursday' THEN ms_thursday
                        WHEN 'Friday' THEN ms_friday
                        WHEN 'Saturday' THEN ms_saturday
                        WHEN 'Sunday' THEN ms_sunday
                    END,
                    '$.time_in'
                )),
                '%h:%i %p'
            )
        END AS start_time,
        CASE 
            WHEN mh_date IS NOT NULL THEN mh_type
            WHEN (
                JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Monday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Tuesday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Wednesday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Thursday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Friday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Saturday'
            ) OR (
                JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' 
                AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00'
                AND DAYNAME(pao_attendancedate) = 'Sunday'
            )
            THEN 'Rest Day'
            ELSE TIME_FORMAT(
                JSON_UNQUOTE(JSON_EXTRACT(
                    CASE DAYNAME(pao_attendancedate)
                        WHEN 'Monday' THEN ms_monday
                        WHEN 'Tuesday' THEN ms_tuesday
                        WHEN 'Wednesday' THEN ms_wednesday
                        WHEN 'Thursday' THEN ms_thursday
                        WHEN 'Friday' THEN ms_friday
                        WHEN 'Saturday' THEN ms_saturday
                        WHEN 'Sunday' THEN ms_sunday
                    END,
                    '$.time_out'
                )),
                '%h:%i %p'
            )
        END AS end_time,
        JSON_UNQUOTE(JSON_EXTRACT(
            CASE DAYNAME(pao_attendancedate)
                WHEN 'Monday' THEN ms_monday
                WHEN 'Tuesday' THEN ms_tuesday
                WHEN 'Wednesday' THEN ms_wednesday
                WHEN 'Thursday' THEN ms_thursday
                WHEN 'Friday' THEN ms_friday
                WHEN 'Saturday' THEN ms_saturday
                WHEN 'Sunday' THEN ms_sunday
            END,
            '$.time_in'
        )) AS scheduledtimein,
        JSON_UNQUOTE(JSON_EXTRACT(
            CASE DAYNAME(pao_attendancedate)
                WHEN 'Monday' THEN ms_monday
                WHEN 'Tuesday' THEN ms_tuesday
                WHEN 'Wednesday' THEN ms_wednesday
                WHEN 'Thursday' THEN ms_thursday
                WHEN 'Friday' THEN ms_friday
                WHEN 'Saturday' THEN ms_saturday
                WHEN 'Sunday' THEN ms_sunday
            END,
            '$.time_out'
        )) AS scheduledtimeout,
        mp_positionname AS positionname,
        md_departmentname AS departmentname,
        pao_fullname AS fullname,
        DATE_FORMAT(pao_attendancedate, '%W, %Y-%m-%d') AS attendancedate,
        DATE_FORMAT(pao_clockin, '%Y-%m-%dT%H:%i') AS clockin,
        DATE_FORMAT(pao_clockout, '%Y-%m-%dT%H:%i') AS clockout,
        pao_total_hours AS totalhours,
        pao_early_ot AS earlyot,
        pao_normal_ot AS normalot,
        pao_night_differentials AS nightdiff,
        DATE_FORMAT(pao_payroll_date, '%Y-%m-%d') AS payrolldate,
        pao_status AS status,
        pao_night_hours_pay as nightotpay,
        pao_normal_ot_pay as normalotpay,
        pao_early_ot_pay as earlyotpay,
        pao_total_ot_net_pay as totalotpay,
        pao_reason AS reason,
        pao_overtimeimage as overtimeimages,
            (
            SELECT ora_commnet 
            FROM overtime_request_activity 
            WHERE ora_overtimeid = pao_id
            ORDER BY ora_date DESC
            LIMIT 1
        ) AS comment
        FROM payroll_approval_ot
        INNER JOIN master_shift ON payroll_approval_ot.pao_employeeid = ms_employeeid
        INNER JOIN master_employee ON master_shift.ms_employeeid = me_id
        LEFT JOIN master_holiday ON pao_attendancedate = mh_date
        INNER JOIN master_department ON master_employee.me_department = md_departmentid
        INNER JOIN master_position ON master_employee.me_position = mp_positionid
        WHERE pao_id = '${approveot_id}'
        LIMIT 1`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
        console.log(result, "result");
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

// router.post("/addrequstot", (req, res) => {
//   try {
//     let clockin = req.body.clockin;
//     let clockout = req.body.clockout;
//     let attendancedate = req.body.attendancedate;
//     let employeeid = req.body.employeeid;
//     let payrolldate = req.body.payrolldate;
//     let reason = req.body.reason;
//     let overtimestatus = req.body.overtimestatus;
//     let subgroup = req.body.subgroup;
//     let approvecount = 0;
//     let overtimeimage = req.body.overtimeimage;
//     let deviceaction = "App Manual";
//     let applieddate = GetCurrentDatetime();

//     let sql = `call hrmis.RequestOvertime(
// 	  '${clockin}',
// 	  '${clockout}',
// 	  '${attendancedate}',
// 	  '${employeeid}',
// 	  '${payrolldate}',
// 	  '${overtimestatus}',
// 	  '${subgroup}',
// 	  '${overtimeimage}',
// 	  '${deviceaction}',
// 	  '${applieddate}',
// 	  '${reason}',
// 	  '${approvecount}')`;

//     let checkStatement = SelectStatement(
//       "SELECT * FROM payroll_approval_ot WHERE pao_employeeid=? AND pao_attendancedate=?",
//       [employeeid, attendancedate]
//     );

//     Check(checkStatement)
//       .then((result) => {
//         if (result != 0) {
//           return res.json(JsonWarningResponse(MessageStatus.EXIST));
//         } else {
//           mysql.StoredProcedure(sql, (err, insertResult) => {
//             if (err) {
//               console.error(err);
//               res.json(JsonErrorResponse(err));
//             } else {
//               console.log(insertResult);
//               res.json(JsonSuccess());
//             }
//           });
//         }
//       })
//       .catch((error) => {
//         console.log(error);
//         res.json(JsonErrorResponse(error));
//       });
//   } catch (error) {
//     console.log(error);
//     res.json(JsonErrorResponse(error));
//   }
// });

router.post("/addrequstot", (req, res) => {
  try {
    let {
      clockin,
      clockout,
      attendancedate,
      employeeid,
      payrolldate,
      reason,
      overtimestatus,
      subgroup,
      overtimeimage,
    } = req.body;

    let approvecount = 0;
    let deviceaction = "App Manual";
    let applieddate = GetCurrentDatetime();

    let sql = `CALL hrmis.RequestOvertime(
      '${clockin}',
      '${clockout}',
      '${attendancedate}',
      '${employeeid}',
      '${payrolldate}',
      '${overtimestatus}',
      '${subgroup}',
      '${overtimeimage}',
      '${deviceaction}',
      '${applieddate}',
      '${reason}',
      '${approvecount}'
    )`;

    let validationQuery1 = SelectStatement(
      `SELECT 1 FROM payroll_approval_ot WHERE pao_attendancedate = ? AND pao_employeeid = ? AND pao_status = 'Pending'`,
      [attendancedate, employeeid]
    );

    let validationQuery2 = SelectStatement(
      `SELECT 1 FROM payroll_approval_ot WHERE pao_attendancedate = ? AND pao_employeeid = ? AND pao_status = 'Applied'`,
      [attendancedate, employeeid]
    );

    let validationQuery3 = SelectStatement(
      `SELECT 1 FROM payroll_approval_ot WHERE pao_attendancedate = ? AND pao_employeeid = ? AND pao_status = 'Approved'`,
      [attendancedate, employeeid]
    );

    Check(validationQuery1)
      .then((result1) => {
        if (result1.length > 0) {
          return Promise.reject(JsonWarningResponse(MessageStatus.EXIST,MessageStatus.PENDINGOT));
        }
        return Check(validationQuery2);
      })
      .then((result2) => {
        if (result2.length > 0) {
          return Promise.reject(JsonWarningResponse(MessageStatus.EXIST,MessageStatus.APPLIEDOT));
        }
        return Check(validationQuery3);
      })
      .then((result3) => {
        if (result3.length > 0) {
          return Promise.reject(JsonWarningResponse(MessageStatus.EXIST,MessageStatus.APPROVEDOT));
        }
        mysql.StoredProcedure(sql, (err, insertResult) => {
          if (err) {
            console.error(err);
            return res.json(JsonErrorResponse(err));
          } else {
            console.log(insertResult);
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


router.post("/update", (req, res) => {
  try {
    let approveot_id = req.body.approveot_id;
    let clockin = req.body.clockin;
    let clockout = req.body.clockout;
    let attendancedate = req.body.attendancedate;
    let payrolldate = req.body.payrolldate;
    let employeeid = req.body.employeeid;
    let overtimestatus = req.body.overtimestatus;
    let reason = req.body.reason;
    let subgroup = req.body.subgroup;
    let overtimeimage = req.body.overtimeimage;
    let deviceaction = "App Automated";
    let applieddate = GetCurrentDatetime();
    let approvecount = 0;

    let sql = `call hrmis.UpdateRequestOvertime(
		'${clockin}',
		'${clockout}',
		'${attendancedate}',
		'${employeeid}',
		'${payrolldate}',
		'${overtimestatus}',
		'${subgroup}',
		'${overtimeimage}',
		'${deviceaction}',
		'${applieddate}',
		'${reason}',
		'${approvecount}',
		'${approveot_id}')`;

    let validationQuery1 = SelectStatement(
      `SELECT 1 FROM payroll_approval_ot WHERE pao_attendancedate = ? AND pao_employeeid = ? AND pao_status = 'Pending'`,
      [attendancedate, employeeid]
    );

    let validationQuery2 = SelectStatement(
      `SELECT 1 FROM payroll_approval_ot WHERE pao_attendancedate = ? AND pao_employeeid = ? AND pao_status = 'Applied'`,
      [attendancedate, employeeid]
    );

    let validationQuery3 = SelectStatement(
      `SELECT 1 FROM payroll_approval_ot WHERE pao_attendancedate = ? AND pao_employeeid = ? AND pao_status = 'Approved'`,
      [attendancedate, employeeid]
    );

    Check(validationQuery1)
      .then((result1) => {
        if (result1.length > 0) {
          return Promise.reject(JsonWarningResponse(MessageStatus.EXIST,MessageStatus.PENDINGOT));
        }
        return Check(validationQuery2);
      })
      .then((result2) => {
        if (result2.length > 0) {
          return Promise.reject(JsonWarningResponse(MessageStatus.EXIST,MessageStatus.APPLIEDOT));
        }
        return Check(validationQuery3);
      })
      .then((result3) => {
        if (result3.length > 0) {
          return Promise.reject(JsonWarningResponse(MessageStatus.EXIST,MessageStatus.APPROVEDOT));
        }
        mysql.StoredProcedure(sql, (err, insertResult) => {
          if (err) {
            console.error(err);
            return res.json(JsonErrorResponse(err));
          } else {
            console.log(insertResult);
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



router.post("/getattendancedate", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let attendancedate = req.body.attendancedate;
    let sql = `SELECT
    ma_attendanceid as pao_attendanceid,
    DATE_FORMAT(ma_clockin, '%Y-%m-%d %H:%i:%s') AS pao_clockin,
    DATE_FORMAT(ma_clockout, '%Y-%m-%d %H:%i:%s') AS pao_clockout,
    ma_attendancedate as pao_attendancedate,
    CASE 
        WHEN mh_date IS NOT NULL THEN mh_type
        WHEN (
            JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Monday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Tuesday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Wednesday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Thursday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Friday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Saturday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Sunday'
        )
        THEN 'Rest Day'
        ELSE TIME_FORMAT(
            JSON_UNQUOTE(JSON_EXTRACT(
                CASE DAYNAME(ma_attendancedate)
                    WHEN 'Monday' THEN ms_monday
                    WHEN 'Tuesday' THEN ms_tuesday
                    WHEN 'Wednesday' THEN ms_wednesday
                    WHEN 'Thursday' THEN ms_thursday
                    WHEN 'Friday' THEN ms_friday
                    WHEN 'Saturday' THEN ms_saturday
                    WHEN 'Sunday' THEN ms_sunday
                END,
                '$.time_in'
            )),
            '%h:%i %p'
        )
    END AS pao_starttime,
    CASE 
        WHEN mh_date IS NOT NULL THEN mh_type
        WHEN (
            JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_monday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Monday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_tuesday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Tuesday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_wednesday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Wednesday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_thursday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Thursday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_friday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Friday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_saturday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Saturday'
        ) OR (
            JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_in')) = '00:00:00' 
            AND JSON_UNQUOTE(JSON_EXTRACT(ms_sunday, '$.time_out')) = '00:00:00'
            AND DAYNAME(ma_attendancedate) = 'Sunday'
        )
        THEN 'Rest Day'
        ELSE TIME_FORMAT(
            JSON_UNQUOTE(JSON_EXTRACT(
                CASE DAYNAME(ma_attendancedate)
                    WHEN 'Monday' THEN ms_monday
                    WHEN 'Tuesday' THEN ms_tuesday
                    WHEN 'Wednesday' THEN ms_wednesday
                    WHEN 'Thursday' THEN ms_thursday
                    WHEN 'Friday' THEN ms_friday
                    WHEN 'Saturday' THEN ms_saturday
                    WHEN 'Sunday' THEN ms_sunday
                END,
                '$.time_out'
            )),
            '%h:%i %p'
        )
    END AS pao_endtime,
    JSON_UNQUOTE(JSON_EXTRACT(
        CASE DAYNAME(ma_attendancedate)
            WHEN 'Monday' THEN ms_monday
            WHEN 'Tuesday' THEN ms_tuesday
            WHEN 'Wednesday' THEN ms_wednesday
            WHEN 'Thursday' THEN ms_thursday
            WHEN 'Friday' THEN ms_friday
            WHEN 'Saturday' THEN ms_saturday
            WHEN 'Sunday' THEN ms_sunday
        END,
        '$.time_in'
    )) AS pao_schedtimein,
    JSON_UNQUOTE(JSON_EXTRACT(
        CASE DAYNAME(ma_attendancedate)
            WHEN 'Monday' THEN ms_monday
            WHEN 'Tuesday' THEN ms_tuesday
            WHEN 'Wednesday' THEN ms_wednesday
            WHEN 'Thursday' THEN ms_thursday
            WHEN 'Friday' THEN ms_friday
            WHEN 'Saturday' THEN ms_saturday
            WHEN 'Sunday' THEN ms_sunday
        END,
        '$.time_out'
    )) AS pao_schedtimeout,
    mp_positionname AS pao_positioname,
    md_departmentname AS pao_departmentname,
    concat(me_lastname,' ',me_firstname) AS pao_fullname
FROM master_attendance
INNER JOIN master_shift ON master_attendance.ma_employeeid = ms_employeeid
INNER JOIN master_employee ON master_shift.ms_employeeid = me_id
LEFT JOIN master_holiday ON ma_attendancedate = mh_date
INNER JOIN master_department ON master_employee.me_department = md_departmentid
INNER JOIN master_position ON master_employee.me_position = mp_positionid
WHERE me_id = '${employeeid}' AND 
 ma_attendancedate = '${attendancedate}'
LIMIT 1;
    `;

    Check(sql)
      .then((result) => {
        if (result.length === 0) {
          return res.json(JsonWarningResponse(MessageStatus.NOTEXIST));
        } else {
          Select(sql, (err, result) => {
            if (err) {
              console.error(err);
              res.json(JsonErrorResponse(err));
            }

            if (result != 0) {
              let data = DataModeling(result, "pao_");
              res.json(JsonDataResponse(data));
            } else {
              res.json(JsonDataResponse(result));
            }
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}
