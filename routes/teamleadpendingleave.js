const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  JsonWarningResponse,
  JsonErrorResponse,
  JsonSuccess,
} = require("./repository/response");
const { InsertTable, Select } = require("./repository/dbconnect");
const {
  SelectStatement,
  InsertStatement,
} = require("./repository/customhelper");
const { REQUEST } = require("./repository/dictionary");
const { SendEmailNotificationEmployee } = require("./repository/emailsender");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('pendingleavelayout', { title: 'Express' });
  Validator(req, res, "teamleadpendingleavelayout", "teamleadpendingleave");
});

module.exports = router;

// router.get("/load", (req, res) => {
//   try {
//     let departmentid = req.session.departmentid;
//     let subgroupid = req.session.subgroupid;
//     let accesstypeid = req.session.accesstypeid;
//     let sql = `SELECT
//     l_leaveid,
//     concat(me_lastname,' ',me_firstname) as l_employeeid,
//     DATE_FORMAT(l_leavestartdate, '%Y-%m-%d') AS l_leavestartdate,
//     DATE_FORMAT(l_leaveenddate, '%Y-%m-%d') AS l_leaveenddate,
//     ml_leavetype as l_leavetype,
//     l_leavereason,
//     l_leaveapplieddate
//     FROM leaves
//     INNER JOIN
//     master_employee ON leaves.l_employeeid = me_id
//     INNER JOIN master_leaves ON leaves.l_leavetype = ml_id
//     WHERE l_leavestatus = 'Pending'
//     AND l_subgroupid IN (${subgroupid})
//     AND me_department = '${departmentid}'
//     AND l_employeeid NOT IN (
//         SELECT tu_employeeid FROM teamlead_user)
//       AND l_approvalcount = (
//         SELECT ats_count
//         FROM aprroval_stage_settings
//         WHERE ats_accessid = '${accesstypeid}'
//         AND ats_departmentid = '${departmentid}'
//     )`;

//     mysql.Select(sql, "Leaves", (err, result) => {
//       if (err) console.error("Error: ", err);

//       res.json({
//         msg: "success",
//         data: result,
//       });
//     });
//   } catch (error) {
//     console.log(error);
//   }
// });

router.get("/load", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `SELECT 
    l_leaveid,
    concat(me_lastname,' ',me_firstname) as l_employeeid,
    DATE_FORMAT(l_leavestartdate, '%Y-%m-%d') AS l_leavestartdate,
    DATE_FORMAT(l_leaveenddate, '%Y-%m-%d') AS l_leaveenddate,
    ml_leavetype as l_leavetype,
    l_leavereason,
    l_leaveapplieddate
    FROM leaves
    INNER JOIN
    master_employee ON leaves.l_employeeid = me_id
    INNER JOIN master_leaves ON leaves.l_leavetype = ml_id
    INNER JOIN 
        aprroval_stage_settings ON 
            aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
            aprroval_stage_settings.ats_subgroupid = leaves.l_subgroupid AND
            aprroval_stage_settings.ats_count = leaves.l_approvalcount
            WHERE 
            l_leavestatus = 'Pending' 
        AND l_subgroupid IN (${subgroupid})`;

    mysql.Select(sql, "Leaves", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/leaveaction", (req, res) => {
  console.log("HIT");
  try {
    let employeeid = req.session.employeeid;
    let departmentid = req.session.departmentid;
    let subgroupid = req.body.subgroupid;
    let leaveid = req.body.leaveid;
    let status = req.body.status;
    let comment = req.body.comment;
    const { startdate, enddate } = req.body;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");

    let data = [];

    data.push([
      employeeid,
      departmentid,
      leaveid,
      subgroupid,
      status,
      createdate,
      comment,
    ]);

    console.log(data);

    mysql.InsertTable("leave_request_activity", data, (err, result) => {
      if (err) console.error("Error: ", err);

      console.log(result);

      let emailbody = [
        {
          employeename: employeeid,
          date: createdate,
          startdate: startdate,
          enddate: enddate,
          reason: comment,
          requesttype: REQUEST.LEAVE,
        },
      ];
      SendEmailNotificationEmployee(
        employeeid,
        subgroupid,
        REQUEST.LEAVE,
        emailbody
      );

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

router.post("/leaveaction", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let departmentid = req.session.departmentid;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    const { subgroupid, leaveid, status, comment, startdate, enddate } =
      req.body;

    let sql = InsertStatement("leave_request_activity", "lra", [
      "employeeid",
      "departmentid",
      "leaveid",
      "subgroupid",
      "status",
      "date",
      "comment",
    ]);

    console.log(InsertStatement);

    console.log(sql);

    let data = [
      [
        employeeid,
        departmentid,
        subgroupid,
        leaveid,
        status,
        createdate,
        comment,
      ],
    ];
    let checkStatement = SelectStatement(
      "select * from leave_request_activity where lra_employeeid=? and lra_leaveid=? and lra_subgroupid=? and lra_status=?",
      [employeeid, leaveid, subgroupid, status]
    );

    console.log(checkStatement);

    Check(checkStatement)
      .then((result) => {
        console.log(result);
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              console.log(err);
              res.json(JsonErrorResponse(err));
            }

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(err);
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
