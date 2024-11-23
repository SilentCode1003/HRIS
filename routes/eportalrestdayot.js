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

router.put("/edit", (req, res) => {
  try {
    let createdby = req.session.fullname;
    let createddate = GetCurrentDatetime();
    const {
      rdotid,
      status,
      clockin,
      clockout,
      total_hours,
      attendancedate,
      payrolldate,
      subgroup,
      file,
      employeeid,
    } = req.body;


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

    if (total_hours) {
      data.push(total_hours);
      columns.push("total_hours");
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

    if (file) {
      data.push(file);
      columns.push("file");
    }

    if (subgroup) {
      data.push(subgroup);
      columns.push("subgroupid");
    }

    if (rdotid) {
      data.push(rdotid);
      arguments.push("rdotid");
    }

    let updateStatement = UpdateStatement(
      "restday_ot_approval",
      "roa",
      columns,
      arguments
    );

    let checkStatement = SelectStatement(
      "select * from restday_ot_approval where roa_employeeid = ? and roa_attendancedate = ? and roa_status = ?",
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

router.post("/save", async (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let fullname = req.session.fullname;
    let attendancedate = req.body.attendancedate;
    let timein = req.body.timein;
    let timeout = req.body.timeout;
    let payrolldate = req.body.payrolldate;
    let subgroupid = req.body.subgroupid;
    let file = req.body.file;
    let status = "Applied";

    let timeInDate = new Date(timein);
    let timeOutDate = new Date(timeout);
    let total_hours = 0;

    if (timeInDate && timeOutDate && timeOutDate > timeInDate) {
      total_hours = (timeOutDate - timeInDate) / (1000 * 60 * 60);
      total_hours = Math.floor(total_hours);
    }

    let sqlSalary = `SELECT 
      CASE 
        WHEN ${total_hours} <= 3 THEN 0
        WHEN ${total_hours} <= 8 THEN
          CASE 
            WHEN s.ms_payrolltype = 'Daily' THEN (s.ms_monthly * 1.30) / 2
            ELSE (s.ms_monthly / 313 * 12 * 1.30) / 2
          END
        ELSE
          CASE 
            WHEN s.ms_payrolltype = 'Daily' THEN (s.ms_monthly * 1.30)
            ELSE (s.ms_monthly / 313 * 12 * 1.30)
          END
      END AS ot_total
      FROM master_salary s 
      WHERE s.ms_employeeid = '${employeeid}'`;

    Select(sqlSalary, (err, result) => {
      if (err) {
        console.error(err);
        return res.json(JsonErrorResponse(err));
      }

      let ot_total = result && result.length > 0 ? result[0].ot_total : 0;

      let sqlInsert = InsertStatement("restday_ot_approval", "roa", [
        "employeeid",
        "fullname",
        "timein",
        "timeout",
        "attendancedate",
        "status",
        "total_hours",
        "ot_total",
        "file",
        "createdate",
        "createby",
        "payrolldate",
        "subgroupid",
        "approvalcount",
      ]);

      let data = [
        [
          employeeid,
          fullname,
          timein,
          timeout,
          attendancedate,
          status,
          total_hours,
          ot_total,
          file,
          new Date().toISOString(),
          employeeid,
          payrolldate,
          subgroupid,
          0,
        ],
      ];

      let checkStatement = SelectStatement(
        "SELECT * FROM restday_ot_approval WHERE roa_employeeid=? AND roa_attendancedate=? AND roa_status=?",
        [employeeid, attendancedate, status]
      );

      Check(checkStatement)
        .then((result) => {
          if (result.length > 0) {
            return res.json(JsonWarningResponse(MessageStatus.EXIST));
          } else {
            InsertTable(sqlInsert, data, (err, result) => {
              if (err) {
                console.log(err);
                return res.json(JsonErrorResponse(err));
              }

              res.json(JsonSuccess());
            });
          }
        })
        .catch((error) => {
          console.log(error);
          res.json(JsonErrorResponse(error));
        });
    });
  } catch (error) {
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
