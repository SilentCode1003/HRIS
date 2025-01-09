const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { REQUEST } = require("./repository/enums");
const { SendEmailNotificationEmployee } = require("./repository/emailsender");
const { DataModeling } = require("./model/hrmisdb");
const { JsonErrorResponse, JsonDataResponse } = require("./repository/response");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(req, res, "teamleadpendingcoalayout", "teamleadpendingcoa");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let subgroupid = req.session.subgroupid;
    let accesstypeid = req.session.accesstypeid;
    let sql = `SELECT 
        ar_requestid,
        CONCAT(me_lastname, ' ', me_firstname) AS ar_employeeid,
        DATE_FORMAT(ar_attendace_date, '%Y-%m-%d, %W') AS ar_attendace_date,
        DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
        DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
        ar_total,
        ar_createdate,
        ar_status
    FROM 
        attendance_request
    INNER JOIN 
        master_employee ON attendance_request.ar_employeeid = me_id
    INNER JOIN 
        aprroval_stage_settings ON 
            aprroval_stage_settings.ats_accessid = '${accesstypeid}' AND
            aprroval_stage_settings.ats_subgroupid = attendance_request.ar_subgroupid AND
            aprroval_stage_settings.ats_count = attendance_request.ar_approvalcount
    WHERE 
        ar_status = 'Pending' 
        AND ar_subgroupid IN (${subgroupid})`;

    mysql.Select(sql, "Attendance_Request", (err, result) => {
      if (err) console.error("Error Fetching Data: ", err);

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

// router.get("/load", (req, res) => {
//   try {
//     let departmentid = req.session.departmentid;
//     let subgroupid = req.session.subgroupid;
//     let accesstypeid = req.session.accesstypeid;
//     let sql = `SELECT
//     me_profile_pic,
//     ar_requestid,
//     CONCAT(me_lastname, ' ', me_firstname) AS ar_employeeid,
//     DATE_FORMAT(ar_attendace_date, '%Y-%m-%d, %W') AS ar_attendace_date,
//     DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
//     DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
//     ar_total,
//     ar_createdate,
//     ar_status
//     FROM
//         attendance_request
//     INNER JOIN
//         master_employee ON attendance_request.ar_employeeid = me_id
//     WHERE
//         ar_status = 'Pending'
//         AND ar_subgroupid IN (${subgroupid})
//         AND me_department = '${departmentid}'
//         AND ar_employeeid NOT IN (
//             SELECT tu_employeeid
//             FROM teamlead_user
//         )
//         AND ar_approvalcount = (
//             SELECT ats_count
//             FROM aprroval_stage_settings
//             WHERE ats_accessid = '${accesstypeid}'
//             AND ats_departmentid = '${departmentid}'
//         )`;

//     mysql.Select(sql, "Attendance_Request", (err, result) => {
//       if (err) console.error("Error Fetching Data: ", err);

//       res.json({
//         msg: "success",
//         data: result,
//       });
//     });
//   } catch (error) {
//     res.json({
//       msg: "error",
//       data: error,
//     });
//   }
// });


// router.post("/getreqinteamlead", (req, res) => {
//   try {
//     let requestid = req.body.requestid;
//     let sql = `    
//       SELECT 
//         me_id,
//         me_profile_pic,
//         concat(me_lastname,' ',me_firstname) as ar_employeeid,
//         ar_attendace_date,
//         DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
//         DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
//         ar_total,
//         ar_createdate,
//         ar_status,
//         ar_reason,
//         ar_file,
//         ar_subgroupid
//       FROM attendance_request
//       INNER JOIN
//       master_employee ON attendance_request.ar_employeeid = me_id
//       WHERE ar_requestid = '${requestid}'
//       ORDER BY ar_requestid`;

//     mysql.Select(sql, "Attendance_Request", (err, result) => {
//       if (err) console.error("Error: ", err);

//       res.json({
//         msg: "success",
//         data: result,
//       });
//     });
//   } catch (error) {
//     res.json({
//       msg: "error",
//       error,
//     });
//   }
// });

router.post("/getreqinteamlead", async (req, res) => {
  try {
    const { requestid } = req.body;
    const sql1 = `
      SELECT 
        me_id,
        me_profile_pic,
        CONCAT(me_lastname, ' ', me_firstname) AS ar_employeeid,
        ar_attendace_date,
        DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
        DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
        ar_total,
        ar_createdate,
        ar_status,
        ar_reason,
        ar_file,
        ar_subgroupid
      FROM attendance_request
      INNER JOIN master_employee ON attendance_request.ar_employeeid = me_id
      WHERE ar_requestid = '${requestid}'
      ORDER BY ar_requestid;
    `;

    const attendanceRequestData = await new Promise((resolve, reject) => {
      mysql.Select(sql1, "Attendance_Request", (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    if (!attendanceRequestData || attendanceRequestData.length === 0) {
      return res.json({
        msg: "No attendance request found",
        data: [],
      });
    }

    const { emp_id, attendancedate } = attendanceRequestData[0];
    const sql2 = `
      SELECT
        DATE_FORMAT(ma_clockin, '%Y-%m-%d %H:%i:%s') as ma_clockin,
        DATE_FORMAT(ma_clockout, '%Y-%m-%d %H:%i:%s') as ma_clockout
      FROM master_attendance
      WHERE ma_attendancedate = '${attendancedate}'
      AND ma_employeeid = '${emp_id}';
    `;


    const masterAttendanceData = await new Promise((resolve, reject) => {
      mysql.Select(sql2, "Master_Attendance", (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });  

    res.json({
      msg: "success",
      attendanceRequest: attendanceRequestData[0],
      masterAttendance: masterAttendanceData.length > 0 ? masterAttendanceData[0] : null,
    });
  } catch (error) {
    console.error("Error: ", error);
    res.json({
      msg: "error",
      error,
    });
  }
});



router.get("/loadactionname", (req, res) => {
  try {
    let accesstypeid = req.session.accesstypeid;
    let sql = `select
    ats_approvename,
    ats_rejectname
    from aprroval_stage_settings
    where ats_accessid = '${accesstypeid}'`;

    mysql.Select(sql, "Approval_Stage_Settings", (err, result) => {
      if (err) console.error("Error Fetching Data: ", err);

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

router.post("/attendanceaction", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let departmentid = req.session.departmentid;
    let subgroupid = req.body.subgroupid;
    let requestid = req.body.requestid;
    let status = req.body.status;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");

    let activityData = [];

    activityData.push([
      employeeid,
      departmentid,
      requestid,
      subgroupid,
      status,
      createdate,
    ]);

    mysql.InsertTable(
      "attendance_request_activity",
      activityData,
      (activityErr, activityResult) => {
        if (activityErr) {
          console.error("Activity Insert Error: ", activityErr);
          res.json({ msg: "error" });
          return;
        }

        let selectQuery = `
      SELECT
      ar_status,
      DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') AS ar_timein,
      DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') AS ar_timeout,
      ar_attendace_date,
      ar_employeeid
      FROM attendance_request
      WHERE ar_requestid = '${requestid}'`;


        mysql.Select(
          selectQuery,
          "Attendance_Request",
          (selectErr, selectResult) => {
            if (selectErr) {
              console.error("Select Error: ", selectErr);
              res.json({ msg: "error" });
              return;
            }
            let { timein, timeout, attendancedate, employeeid, requeststatus } =
              selectResult[0];
            if (requeststatus === "Approved") {
              let checkQuery = `
          SELECT 1 FROM master_attendance
          WHERE ma_employeeid = '${employeeid}' AND ma_attendancedate = '${attendancedate}'`;

              mysql.Select(
                checkQuery,
                "Master_Attendance",
                (checkErr, checkResult) => {
                  if (checkErr) {
                    console.error("Check Error: ", checkErr);
                    res.json({ msg: "error" });
                    return;
                  }

                  let latitudein = "14.337957";
                  let latitudeout = "14.337957";
                  let longitudein = "121.060336";
                  let longitudeout = "121.060336";
                  let geofencein = "1";
                  let geofenceout = "1";
                  let devicein = "app";
                  let deviceout = "app";
                  let locationin = "COA";
                  let locationout = "COA";

                  if (checkResult.length > 0) {
                    let updateQuery = `
              UPDATE master_attendance
              SET ma_clockin = '${timein}',
                  ma_clockout = '${timeout}',
                  ma_latitudeIn = '${latitudein}',
                  ma_longitudein = '${longitudein}',
                  ma_latitudeout = '${latitudeout}',
                  ma_longitudeout = '${longitudeout}',
                  ma_gefenceidIn = '${geofencein}',
                  ma_geofenceidOut = '${geofenceout}',
                  ma_devicein = '${devicein}',
                  ma_deviceout = '${deviceout}',
                  ma_locationIn = '${locationin}',
                  ma_locationOut = '${locationout}'
              WHERE ma_employeeid = '${employeeid}' AND ma_attendancedate = '${attendancedate}'`;

                    mysql
                      .Update(updateQuery)
                      .then((result) => {
                        res.json({
                          msg: "success",
                          data: result,
                        });
                      })
                      .catch((error) => {
                        res.json({
                          msg: "error",
                          data: error,
                        });
                      });
                  } else {
                    let attendanceData = [];

                    attendanceData.push([
                      employeeid,
                      attendancedate,
                      timein,
                      timeout,
                      latitudein,
                      longitudein,
                      latitudeout,
                      longitudeout,
                      geofencein,
                      geofenceout,
                      devicein,
                      deviceout,
                      locationin,
                      locationout,
                    ]);

                    mysql.InsertTable(
                      "master_attendance_request",
                      attendanceData,
                      (insertErr, insertResult) => {
                        if (insertErr) {
                          console.error("Insert Error: ", insertErr);
                          res.json({ msg: "error" });
                          return;
                        }
                        res.json({ msg: "success" });
                      }
                    );
                  }
                }
              );
            } else {
              res.json({ msg: "success" });
            }

            let emailbody = [
              {
                employeename: employeeid,
                date: attendancedate,
                timein: timein,
                timeout: timeout,
                status: requeststatus,
                requesttype: REQUEST.COA,
              },
            ];
            SendEmailNotificationEmployee(
              employeeid,
              subgroupid,
              REQUEST.COA,
              emailbody
            );
          }
        );
      }
    );
  } catch (error) {
    console.error("Catch Error: ", error);
    res.json({ msg: "error" });
  }
});
