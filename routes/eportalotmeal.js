const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, Update } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonWarningResponse,
  MessageStatus,
  JsonSuccess,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const {
  UpdateStatement,
  SelectStatement,
} = require("./repository/customhelper");
const { SendEmailNotification } = require("./repository/emailsender");
const { REQUEST } = require("./repository/enums");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalrequestleavelayout', { title: 'Express' });
  Validator(req, res, "eportalotmeallayout", "eportalotmeal");
});

module.exports = router;

router.get("/loadPending", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT 
    oma_mealid,
    DATE_FORMAT(oma_attendancedate, '%W, %Y-%m-%d') AS oma_attendancedate,
    DATE_FORMAT(oma_clockin, '%d %M %Y, %h:%i %p') AS oma_clockin,
    DATE_FORMAT(oma_clockout, '%d %M %Y, %h:%i %p') AS oma_clockout,
    oma_totalovertime,
    s_name as oma_subgroupid,
    oma_otmeal_amount,
    oma_status
    FROM  ot_meal_allowances
    INNER JOIN subgroup ON ot_meal_allowances.oma_subgroupid = s_id
    WHERE oma_employeeid = '${employeeid}'
    AND oma_status = 'Pending'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "oma_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.get("/loadApplied", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT 
    oma_mealid,
    DATE_FORMAT(oma_attendancedate, '%W, %Y-%m-%d') AS oma_attendancedate,
    DATE_FORMAT(oma_clockin, '%d %M %Y, %h:%i %p') AS oma_clockin,
    DATE_FORMAT(oma_clockout, '%d %M %Y, %h:%i %p') AS oma_clockout,
    oma_totalovertime,
    s_name as oma_subgroupid,
    oma_otmeal_amount,
    oma_status
    FROM  ot_meal_allowances
    INNER JOIN subgroup ON ot_meal_allowances.oma_subgroupid = s_id
    WHERE oma_employeeid = '${employeeid}'
    AND oma_status = 'Applied'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "oma_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.get("/loadApproved", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT 
    oma_mealid,
    DATE_FORMAT(oma_attendancedate, '%W, %Y-%m-%d') AS oma_attendancedate,
    DATE_FORMAT(oma_clockin, '%d %M %Y, %h:%i %p') AS oma_clockin,
    DATE_FORMAT(oma_clockout, '%d %M %Y, %h:%i %p') AS oma_clockout,
    oma_totalovertime,
    s_name as oma_subgroupid,
    oma_otmeal_amount,
    oma_status
    FROM  ot_meal_allowances
    INNER JOIN subgroup ON ot_meal_allowances.oma_subgroupid = s_id
    WHERE oma_employeeid = '${employeeid}'
    AND oma_status = 'Approved'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "oma_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.get("/loadRejected", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT 
    oma_mealid,
    DATE_FORMAT(oma_attendancedate, '%W, %Y-%m-%d') AS oma_attendancedate,
    DATE_FORMAT(oma_clockin, '%d %M %Y, %h:%i %p') AS oma_clockin,
    DATE_FORMAT(oma_clockout, '%d %M %Y, %h:%i %p') AS oma_clockout,
    oma_totalovertime,
    s_name as oma_subgroupid,
    oma_otmeal_amount,
    oma_status
    FROM  ot_meal_allowances
    INNER JOIN subgroup ON ot_meal_allowances.oma_subgroupid = s_id
    WHERE oma_employeeid = '${employeeid}'
    AND oma_status = 'Rejected'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "oma_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.get("/loadCancelled", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT 
    oma_mealid,
    DATE_FORMAT(oma_attendancedate, '%W, %Y-%m-%d') AS oma_attendancedate,
    DATE_FORMAT(oma_clockin, '%d %M %Y, %h:%i %p') AS oma_clockin,
    DATE_FORMAT(oma_clockout, '%d %M %Y, %h:%i %p') AS oma_clockout,
    oma_totalovertime,
    s_name as oma_subgroupid,
    oma_otmeal_amount,
    oma_status
    FROM  ot_meal_allowances
    INNER JOIN subgroup ON ot_meal_allowances.oma_subgroupid = s_id
    WHERE oma_employeeid = '${employeeid}'
    AND oma_status = 'Cancelled'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "oma_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getotmeal", (req, res) => {
  try {
    let mealotid = req.body.mealotid;
    let sql = `SELECT 
    oma_mealid,
    oma_attendancedate,
    DATE_FORMAT(oma_clockin, '%Y-%m-%dT%H:%i') AS oma_clockin,
    DATE_FORMAT(oma_clockout, '%Y-%m-%dT%H:%i') AS oma_clockout,
    oma_totalovertime,
    oma_subgroupid,
    DATE_FORMAT(oma_payroll_date, '%Y-%m-%d') AS oma_payroll_date,
    oma_otmeal_amount,
    oma_approvalcount,
    oma_image,
    oma_status
    FROM  ot_meal_allowances
    WHERE oma_mealid = '${mealotid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "oma_");
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
    const {
      mealotid,
      employeeid,
      clockin,
      clockout,
      totalovertime,
      attendancedate,
      payroll_date,
      otmeal_amount,
      approvalcount,
      status,
      subgroupid,
      image,
    } = req.body;
    let applieddate = currentDate.format("YYYY-MM-DD HH:mm:ss");

    let data = [];
    let columns = [];
    let arguments = [];

    if (employeeid) {
      data.push(employeeid);
      columns.push("employeeid");
    }

    if (attendancedate) {
      data.push(attendancedate);
      columns.push("attendancedate");
    }

    if (clockin) {
      data.push(clockin);
      columns.push("clockin");
    }

    if (clockout) {
      data.push(clockout);
      columns.push("clockout");
    }

    if (totalovertime) {
      data.push(totalovertime);
      columns.push("totalovertime");
    }

    if (otmeal_amount) {
      data.push(otmeal_amount);
      columns.push("otmeal_amount");
    }

    if (payroll_date) {
      data.push(payroll_date);
      columns.push("payroll_date");
    }

    if (status) {
      data.push(status);
      columns.push("status");
    }

    if (subgroupid) {
      data.push(subgroupid);
      columns.push("subgroupid");
    }

    if (image) {
      data.push(image);
      columns.push("image");
    }

    if (approvalcount) {
      data.push(approvalcount);
      columns.push("approvalcount");
    }

    if (applieddate) {
      data.push(applieddate);
      columns.push("applieddate");
    }

    if (mealotid) {
      data.push(mealotid);
      arguments.push("mealid");
    }

    let updateStatement = UpdateStatement(
      "ot_meal_allowances",
      "oma",
      columns,
      arguments
    );

    if (status === "Cancelled") {
      Update(updateStatement, data, (err, result) => {
        if (err) {
          console.error("Error: ", err);
          return res.json(JsonErrorResponse(err));
        }

        let emailbody = [
          {
            employeename: employeeid,
            date: attendancedate,
            startdate: clockin,
            enddate: clockout,
            reason: REQUEST.OTMEAL,
            status: MessageStatus.CANCELLED,
            requesttype: REQUEST.OTMEAL,
          },
        ];
        SendEmailNotification(
          employeeid,
          subgroupid,
          REQUEST.OTMEAL,
          emailbody
        );
        res.json(JsonSuccess());
      });
    } else {
      let validationQuery2 = SelectStatement(
        `SELECT 1 FROM ot_meal_allowances WHERE oma_attendancedate = ? AND oma_employeeid = ? AND oma_status = 'Applied'`,
        [attendancedate, employeeid]
      );

      let validationQuery3 = SelectStatement(
        `SELECT 1 FROM ot_meal_allowances WHERE oma_attendancedate = ? AND oma_employeeid = ? AND oma_status = 'Approved'`,
        [attendancedate, employeeid]
      );

      Check(validationQuery2)
        .then((result1) => {
          if (result1.length > 0) {
            return Promise.reject(
              JsonWarningResponse(
                MessageStatus.EXIST,
                MessageStatus.APPLIEDOTMEAL
              )
            );
          }
          return Check(validationQuery3);
        })
        .then((result2) => {
          if (result2.length > 0) {
            return Promise.reject(
              JsonWarningResponse(
                MessageStatus.EXIST,
                MessageStatus.APPLIEDOTMEAL
              )
            );
          }
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);

            let emailbody = [
              {
                employeename: employeeid,
                date: attendancedate,
                startdate: clockin,
                enddate: clockout,
                reason: REQUEST.OTMEAL,
                status: MessageStatus.APPLIED,
                requesttype: REQUEST.OTMEAL,
              },
            ];
            SendEmailNotification(
              employeeid,
              subgroupid,
              REQUEST.OTMEAL,
              emailbody
            );
            res.json(JsonSuccess());
          });
        })
        .catch((error) => {
          console.log(error);
          return res.json(error);
        });
    }
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
