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
    ph_nightdiff_ot_total,
    ph_normal_ot_total
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
    mh_name as ph_holidayname
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
    let createdby = req.session.fullname;
    let createddate = GetCurrentDatetime();
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

    let data = [];
    let columns = [];
    let arguments = [];

    if (createdby) {
      data.push(createdby);
      columns.push("createby");
    }

    if (createddate) {
      data.push(createddate);
      columns.push("createdate");
    }

    if (status) {
      data.push(status);
      columns.push("status");
    }

    if (clockin) {
      data.push(clockin);
      columns.push("timein");
    }

    if (clockout) {
      data.push(clockout);
      columns.push("timeout");
    }

    if (attendancedate) {
      data.push(attendancedate);
      columns.push("attendancedate");
    }

    if (payrolldate) {
      data.push(payrolldate);
      columns.push("payrolldate");
    }

    if (holidayimage) {
      data.push(holidayimage);
      columns.push("file");
    }

    if (subgroup) {
      data.push(subgroup);
      columns.push("subgroupid");
    }

    if (holidayid) {
      data.push(holidayid);
      arguments.push("holidayid");
    }

    let updateStatement = UpdateStatement(
      "payroll_holiday",
      "ph",
      columns,
      arguments
    );

    console.log(updateStatement);

    let checkStatement = SelectStatement(
      "select * from payroll_holiday where ph_employeeid = ? and ph_attendancedate = ? and ph_status = ?",
      [employeeid, attendancedate, status]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);
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

router.post("/loadapproved", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select 
    ph_holidayid,
    ph_attendancedate,
    ph_timein,
    ph_timeout,
    ph_holidaytype,
    ph_total_hours,
    ph_nightdiff_ot_total,
    ph_normal_ot_total
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

router.post("/loadrejected", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select 
    ph_holidayid,
    ph_attendancedate,
    ph_timein,
    ph_timeout,
    ph_holidaytype,
    ph_total_hours,
    ph_nightdiff_ot_total,
    ph_normal_ot_total
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
    ph_attendancedate,
    ph_timein,
    ph_timeout,
    ph_holidaytype,
    ph_total_hours,
    ph_nightdiff_ot_total,
    ph_normal_ot_total
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
