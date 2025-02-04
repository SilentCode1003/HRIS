const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, Update } = require("./repository/dbconnect");
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
  GetCurrentDate,
  GetCurrentDatetime,
  SelectStatementWithArray,
  SelectStatement,
} = require("./repository/customhelper");
const { SendEmailNotification } = require("./repository/emailsender");
const { REQUEST } = require("./repository/enums");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "eportalrequestholidaylayout", "eportalrequestholiday");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `select 
    ph_holidayid,
    DATE_FORMAT(ph_attendancedate, '%Y-%m-%d, %W') as ph_attendancedate,
    DATE_FORMAT(ph_timein, '%Y-%m-%d %H:%i:%s') AS ph_timein,
    DATE_FORMAT(ph_timeout, '%Y-%m-%d %H:%i:%s') AS ph_timeout,
    ph_holidaytype,
    ph_total_hours,
    ph_nightdiffot_hour,
    ph_normalot_hour
    from payroll_holiday
    where ph_employeeid = '${employeeid}'
    and ph_status = 'Pending'
    order by ph_attendancedate asc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ph_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getholidayday", (req, res) => {
  try {
    let attendancedate = req.body.attendancedate;
    let employeeid = req.session.employeeid;
    let sql = `SELECT 
    DATE_FORMAT(ma_clockin, '%Y-%m-%d %H:%i:%s') AS ma_clockin,
    DATE_FORMAT(ma_clockout, '%Y-%m-%d %H:%i:%s') AS ma_clockout,
    ma_attendancedate,
    mh_name as ma_name,
    mh_type as ma_type
    FROM master_attendance 
    INNER JOIN master_holiday ON master_attendance.ma_attendancedate = mh_date
    WHERE ma_attendancedate = '${attendancedate}'
    AND mh_date = '${attendancedate}'
    AND ma_employeeid = '${employeeid}'`;

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
              let data = DataModeling(result, "ma_");
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
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});


router.post("/addrequestholiday", (req, res) => {
  try {
    let {
      clockin,
      clockout,
      attendancedate,
      employeeid,
      payrolldate,
      holidayStatus,
      subGroup,
      holidayImage,
    } = req.body;


    console.log(req.body);
    

    let approvecount = 0;
    let applieddate = GetCurrentDatetime();

    let sql = `CALL hrmis.RequestHoliday(
      '${clockin}',
      '${clockout}',
      '${attendancedate}',
      '${employeeid}',
      '${payrolldate}',
      '${holidayStatus}',
      '${subGroup}',
      '${holidayImage}',
      '${applieddate}',
      '${approvecount}'
    )`;

    let validationQuery1 = SelectStatement(
      `SELECT 1 FROM payroll_holiday WHERE ph_attendancedate = ? AND ph_employeeid = ? AND ph_status = 'Pending'`,
      [attendancedate, employeeid]
    );

    let validationQuery2 = SelectStatement(
      `SELECT 1 FROM payroll_holiday WHERE ph_attendancedate = ? AND ph_employeeid = ? AND ph_status = 'Applied'`,
      [attendancedate, employeeid]
    );

    let validationQuery3 = SelectStatement(
      `SELECT 1 FROM payroll_holiday WHERE ph_attendancedate = ? AND ph_employeeid = ? AND ph_status = 'Approved'`,
      [attendancedate, employeeid]
    );

    Check(validationQuery1)
      .then((result1) => {
        if (result1.length > 0) {
          return Promise.reject(
            JsonWarningResponse(MessageStatus.EXIST, MessageStatus.PENDINGOT)
          );
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

router.post("/getreqholiday", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let holidayid = req.body.holidayid;
    let sql = `    
    SELECT 
    DATE_FORMAT(ph_attendancedate, '%Y-%m-%d') as ph_attendancedate,
    DATE_FORMAT(ph_timein, '%Y-%m-%d %H:%i:%s') AS ph_timein,
    DATE_FORMAT(ph_timeout, '%Y-%m-%d %H:%i:%s') AS ph_timeout,
    ph_status,
    ph_holidaytype,
    DATE_FORMAT(ph_holidaydate, '%Y-%m-%d') as ph_holidaydate,
    mh_name as ph_holidayname,
    ph_file,
    DATE_FORMAT(ph_payrolldate, '%Y-%m-%d') AS ph_payrolldate,
    ph_subgroupid
    FROM payroll_holiday
    INNER JOIN master_holiday ON payroll_holiday.ph_holidaydate = mh_date
    WHERE ph_employeeid='${employeeid}' AND ph_holidayid = '${holidayid}'
    ORDER BY ph_holidayid DESC`;
    console.log(employeeid);

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      console.log(result);

      if (result != 0) {
        let data = DataModeling(result, "ph_");
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

router.put("/edit", (req, res) => {
  try {
    let createddate = GetCurrentDatetime();
    let approvecount = 0;
    const {
      holidayid,
      status,
      clockin,
      clockout,
      attendancedate,
      payrolldate,
      subgroup,
      holidayimage,
      employeeid,
    } = req.body;

    console.log(req.body);

    let sql = `call hrmis.UpdateRequestHoliday(
      '${clockin}',
      '${clockout}',
      '${attendancedate}',
      '${employeeid}',
      '${payrolldate}',
      '${status}',
      '${subgroup}',
      '${holidayimage}',
      '${createddate}',
      '${approvecount}',
      '${holidayid}')`;

    let validationQuery2 = SelectStatement(
      `SELECT 1 FROM payroll_holiday WHERE ph_attendancedate = ? AND ph_employeeid = ? AND ph_status = 'Applied'`,
      [attendancedate, employeeid]
    );

    let validationQuery3 = SelectStatement(
      `SELECT 1 FROM payroll_holiday WHERE ph_attendancedate = ? AND ph_employeeid = ? AND ph_status = 'Approved'`,
      [attendancedate, employeeid]
    );

    Check(validationQuery2)
      .then((result1) => {
        if (result1.length > 0) {
          return Promise.reject(
            JsonWarningResponse(MessageStatus.EXIST, MessageStatus.APPLIEDOT)
          );
        }
        return Check(validationQuery3);
      })
      .then((result2) => {
        if (result2.length > 0) {
          return Promise.reject(
            JsonWarningResponse(MessageStatus.EXIST, MessageStatus.APPROVEDOT)
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

router.post("/loadapproved", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select 
    ph_holidayid,
    DATE_FORMAT(ph_attendancedate, '%Y-%m-%d') as ph_attendancedate,
    DATE_FORMAT(ph_timein, '%Y-%m-%d %H:%i:%s') AS ph_timein,
    DATE_FORMAT(ph_timeout, '%Y-%m-%d %H:%i:%s') AS ph_timeout,
    ph_holidaytype,
    ph_total_hours,
    ph_nightdiffot_hour,
    ph_normalot_hour
    from payroll_holiday
    where ph_employeeid = '${employeeid}'
    and ph_status = 'Approved'
    order by ph_attendancedate asc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }
      if (result != 0) {
        let data = DataModeling(result, "ph_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/loadapplied", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select 
    ph_holidayid,
    DATE_FORMAT(ph_attendancedate, '%Y-%m-%d') as ph_attendancedate,
    DATE_FORMAT(ph_timein, '%Y-%m-%d %H:%i:%s') AS ph_timein,
    DATE_FORMAT(ph_timeout, '%Y-%m-%d %H:%i:%s') AS ph_timeout,
    ph_holidaytype,
    ph_total_hours,
    ph_nightdiffot_hour,
    ph_normalot_hour
    from payroll_holiday
    where ph_employeeid = '${employeeid}'
    and ph_status = 'Applied'
    order by ph_attendancedate asc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }
      if (result != 0) {
        let data = DataModeling(result, "ph_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/loadrejected", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select 
    ph_holidayid,
    DATE_FORMAT(ph_attendancedate, '%Y-%m-%d') as ph_attendancedate,
    DATE_FORMAT(ph_timein, '%Y-%m-%d %H:%i:%s') AS ph_timein,
    DATE_FORMAT(ph_timeout, '%Y-%m-%d %H:%i:%s') AS ph_timeout,
    ph_holidaytype,
    ph_total_hours,
    ph_nightdiffot_hour,
    ph_normalot_hour
    from payroll_holiday
    where ph_employeeid = '${employeeid}'
    and ph_status = 'Rejected'
    order by ph_attendancedate asc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }
      if (result != 0) {
        let data = DataModeling(result, "ph_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/loadcancelled", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select 
    ph_holidayid,
    DATE_FORMAT(ph_attendancedate, '%Y-%m-%d') as ph_attendancedate,
    DATE_FORMAT(ph_timein, '%Y-%m-%d %H:%i:%s') AS ph_timein,
    DATE_FORMAT(ph_timeout, '%Y-%m-%d %H:%i:%s') AS ph_timeout,
    ph_holidaytype,
    ph_total_hours,
    ph_nightdiffot_hour,
    ph_normalot_hour
    from payroll_holiday
    where ph_employeeid = '${employeeid}'
    AND ph_status IN ('Cancelled','Cancel')
    order by ph_attendancedate asc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ph_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.log(error);
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
