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
const { REQUEST } = require("./repository/enums");
const { SendEmailNotificationEmployee } = require("./repository/emailsender");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('pendingleavelayout', { title: 'Express' });
  Validator(req, res, "teamleadpendingleavelayout", "teamleadpendingleave");
});

module.exports = router;

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
  try {
    const departmentid = req.session.departmentid;
    const subgroupid = req.body.subgroupid;
    const leaveid = req.body.leaveid;
    const status = req.body.status;
    const comment = req.body.comment;
    const { startdate, enddate } = req.body;
    const createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");

    const employeeinfoQuery = `select l_employeeid as employeeid from leaves where l_leaveid = '${leaveid}'`;

    async function ProcessData() {
      const employeeid = await mysql.mysqlQueryPromise(employeeinfoQuery);
      const conflictQuery = `SELECT * 
      FROM leave_dates 
      WHERE ld_employeeid = '${employeeid[0].employeeid}' 
      AND ld_leavedates BETWEEN '${startdate}' AND '${enddate}'`;

      const conflictResult = await mysql.mysqlQueryPromise(conflictQuery);

      if (conflictResult.length > 0) {
        const conflictingDates = conflictResult.map((row) => {
          const date = new Date(row.ld_leavedates);
          return date.toISOString().split("T")[0];
        });

        return res.json({
          msg: "conflict",
          conflictingDates: conflictingDates,
        });
      } else {
        const data = [
          [
            req.session.employeeid,
            departmentid,
            leaveid,
            subgroupid,
            status,
            createdate,
            comment,
          ],
        ];

        mysql.InsertTable("leave_request_activity", data, (err, result) => {
          if (err) {
            console.error("Error: ", err);
            return res.json({
              msg: "error",
              data: err,
            });
          }

          const emailbody = [
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
      }
    }

    ProcessData();
  } catch (error) {
    console.error("Error in /leaveaction route:", error);
    res.json({
      msg: "error",
      data: error,
    });
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
