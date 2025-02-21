const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  JsonErrorResponse,
  JsonDataResponse,
  MessageStatus,
} = require("./repository/response");
const { Select } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { SendEmailNotification } = require("./repository/emailsender");
var router = express.Router();
const currentDate = moment();

const { REQUEST } = require("./repository/enums");
const { GetCurrentDatetime } = require("./repository/customhelper");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalrequestleavelayout', { title: 'Express' });
  Validator(req, res, "eportalrequestleavelayout", "eportalrequestleave");
});

module.exports = router;

router.post("/loadheader", (req, res) => {
  try {
    let leavesettingsid = req.body.leavesettingsid;
    let employeeid = req.body.employeeid;
    let sql = `select 
    ml_leavetype as leavetype,
    ml_unusedleavedays as unused,
    ml_totalleavedays as totalleave,
    ml_usedleavedays as used
    from master_leaves
    where ml_employeeid = '${employeeid}' 
    and ml_id = '${leavesettingsid}'`;

    mysql
      .mysqlQueryPromise(sql)
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
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

// router.post('/getrestdays', (req,res) => {
//   try {
//     let employeeid = req.body.employeeid;
//     let sql =  `SELECT
//         CONCAT(
//             CASE WHEN JSON_UNQUOTE(ms_monday->'$.time_in') = '00:00:00' THEN 'Monday ' ELSE '' END,
//             CASE WHEN JSON_UNQUOTE(ms_tuesday->'$.time_in') = '00:00:00' THEN 'Tuesday ' ELSE '' END,
//             CASE WHEN JSON_UNQUOTE(ms_wednesday->'$.time_in') = '00:00:00' THEN 'Wednesday ' ELSE '' END,
//             CASE WHEN JSON_UNQUOTE(ms_thursday->'$.time_in') = '00:00:00' THEN 'Thursday ' ELSE '' END,
//             CASE WHEN JSON_UNQUOTE(ms_friday->'$.time_in') = '00:00:00' THEN 'Friday ' ELSE '' END,
//             CASE WHEN JSON_UNQUOTE(ms_saturday->'$.time_in') = '00:00:00' THEN 'Saturday ' ELSE '' END,
//             CASE WHEN JSON_UNQUOTE(ms_sunday->'$.time_in') = '00:00:00' THEN 'Sunday ' ELSE '' END
//         ) AS restdays
//     FROM master_shift
//     WHERE ms_employeeid = '${employeeid}'`;

//     Select(sql, (err, result) => {
//       if (err) {
//         console.error(err);
//         res.json(JsonErrorResponse(err));
//       }

//

//       if (result != 0) {
//         let data = DataModeling(result, "ms_");

//         console.log(data);
//         res.json(JsonDataResponse(data));
//       } else {
//         res.json(JsonDataResponse(result));
//       }
//     });
//   } catch (error) {
//     res.json(JsonErrorResponse(error));
//   }
// });

router.post("/getrestdays", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT 
        CONCAT(
            CASE WHEN JSON_UNQUOTE(ms_monday->'$.time_in') = '00:00:00' THEN 'Monday ' ELSE '' END,
            CASE WHEN JSON_UNQUOTE(ms_tuesday->'$.time_in') = '00:00:00' THEN 'Tuesday ' ELSE '' END,
            CASE WHEN JSON_UNQUOTE(ms_wednesday->'$.time_in') = '00:00:00' THEN 'Wednesday ' ELSE '' END,
            CASE WHEN JSON_UNQUOTE(ms_thursday->'$.time_in') = '00:00:00' THEN 'Thursday ' ELSE '' END,
            CASE WHEN JSON_UNQUOTE(ms_friday->'$.time_in') = '00:00:00' THEN 'Friday ' ELSE '' END,
            CASE WHEN JSON_UNQUOTE(ms_saturday->'$.time_in') = '00:00:00' THEN 'Saturday ' ELSE '' END,
            CASE WHEN JSON_UNQUOTE(ms_sunday->'$.time_in') = '00:00:00' THEN 'Sunday ' ELSE '' END
        ) AS restdays
    FROM master_shift
    WHERE ms_employeeid = '${employeeid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        return res.json(JsonErrorResponse(err));
      }

      if (result.length > 0) {
        let data = DataModeling(result, "ms_");
        res.json(JsonDataResponse(data[0])); // assuming DataModeling returns an array
      } else {
        res.json(JsonDataResponse({ restdays: "" }));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.get("/loadpending", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `select 
    l_leaveid,
    l_leavestartdate,
    l_leaveenddate,
    ml_leavetype as l_leavetype,
    l_leavereason,
    l_leaveapplieddate
    from leaves
    left join master_employee on leaves.l_employeeid = me_id
    inner join master_leaves on leaves.l_leavetype = ml_id
    where l_leavestatus = 'Pending' AND l_employeeid = '${employeeid}'`;

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

router.get("/loadapproved", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `select 
    l_leaveid,
    l_leavestartdate,
    l_leaveenddate,
    ml_leavetype as l_leavetype,
    ml_id as l_leavetypeid,
    l_leavereason,
    l_leaveapplieddate
    from leaves
    left join master_employee on leaves.l_employeeid = me_id
    inner join master_leaves on leaves.l_leavetype = ml_id
    where l_leavestatus = 'Approved' AND l_employeeid = '${employeeid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      //

      if (result != 0) {
        let data = DataModeling(result, "l_");

        //console.log(data);
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/getleavedates", (req, res) => {
  try {
    let masterleaveid = req.body.masterleaveid;
    let sql = `
    SELECT
    ld_dateid,
    CONCAT(me_lastname,' ',me_firstname) AS ld_fullname,
    DATE_FORMAT(ld_leavedates, '%Y-%m-%d') AS ld_leavedates,
    DATE_FORMAT(ld_leavedates, '%W') AS ld_day_name,
    ml_leavetype AS ld_leavetype,
    ml_year AS ld_year,
    DATE_FORMAT(ld_payrolldate, '%Y-%m-%d') AS ld_payrolldate
    FROM leave_dates
    INNER JOIN master_leaves ON leave_dates.ld_leavetype = ml_id
    INNER JOIN master_employee ON leave_dates.ld_employeeid = me_id
    WHERE ml_id = '${masterleaveid}'
    `;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ld_");

        console.log(data);
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
    let sql = `select 
    l_leaveid,
    l_leavestartdate,
    l_leaveenddate,
    ml_leavetype as l_leavetype,
    l_leavereason,
    l_leaveapplieddate
    from leaves
    left join master_employee on leaves.l_employeeid = me_id
    inner join master_leaves on leaves.l_leavetype = ml_id
    where l_leavestatus = 'Rejected' AND l_employeeid = '${employeeid}'`;

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

router.get("/loadcancelled", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `select 
    l_leaveid,
    l_leavestartdate,
    l_leaveenddate,
    ml_leavetype as l_leavetype,
    l_leavereason,
    l_leaveapplieddate
    from leaves
    left join master_employee on leaves.l_employeeid = me_id
    inner join master_leaves on leaves.l_leavetype = ml_id
    where l_leavestatus = 'Cancel' AND l_employeeid = '${employeeid}'`;

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

// router.post("/submit", async (req, res) => {
//   try {
//     const employeeid = req.body.employeeid;
//     const { startdate, enddate, leavetype, reason, image, subgroup } = req.body;
//     const createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
//     const status = "Pending";
//     const durationDays = req.body.durationDays;
//     const paidDays = req.body.paidDays;
//     const unpaidDays = req.body.unpaidDays;
//     const approvedcount = '0';

//     console.log(startdate, enddate, leavetype, reason, employeeid, durationDays, paidDays, unpaidDays);

//     const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
//     const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

//     if (employeeResult.length === 0) {
//       return res.json({ msg: "Invalid employee ID" });
//     }

//     const data = [
//       [
//         employeeid,
//         startdate,
//         enddate,
//         leavetype,
//         reason,
//         image,
//         status,
//         createdate,
//         durationDays,
//         paidDays,
//         unpaidDays,
//         subgroup,
//         approvedcount
//       ],
//     ];

//     mysql.InsertTable("leaves", data, (insertErr, insertResult) => {
//       if (insertErr) {
//         console.error("Error inserting leave record: ", insertErr);
//         res.json({ msg: "insert_failed" });
//       } else {
//         console.log(insertResult);
//         res.json({ msg: "success" });
//       }
//     });
//   } catch (error) {
//     console.error("Error in /submit route: ", error);
//     res.json({ msg: "error" });
//   }
// });

// router.post("/submit", async (req, res) => {
//   try {
//     const {
//       employeeid,
//       startdate,
//       enddate,
//       leavetype,
//       reason,
//       image,
//       subgroup,
//       durationDays,
//       paidDays,
//       unpaidDays,
//     } = req.body;
//     const createdate = moment().format("YYYY-MM-DD HH:mm:ss");
//     const status = "Pending";
//     const approvedcount = "0";

//     console.log("Received request with data:", req.body);

//     // Calculate the date 3 days from now
//     const allowedStartDate = moment().add(3, "days").startOf("day");

//     // Convert startdate to a moment object
//     const startDateMoment = moment(startdate);

//     // Check if the startdate is within the allowed 3-day rule
//     if (startDateMoment.isBefore(allowedStartDate)) {
//       console.log("Start date is within the 3-day rule");
//       return res.json({ msg: "not allowed" });
//     }

//     const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
//     const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

//     if (employeeResult.length === 0) {
//       console.log("Invalid employee ID");
//       return res.json({ msg: "Invalid employee ID" });
//     }

//     const data = [
//       [
//         employeeid,
//         startdate,
//         enddate,
//         leavetype,
//         reason,
//         image,
//         status,
//         createdate,
//         durationDays,
//         paidDays,
//         unpaidDays,
//         subgroup,
//         approvedcount,
//       ],
//     ];

//     mysql.InsertTable("leaves", data, (insertErr, insertResult) => {
//       if (insertErr) {
//         console.error("Error inserting leave record:", insertErr);
//         res.json({ msg: "insert_failed" });
//       } else {
//         console.log("Insert result:", insertResult);

//         let emailbody = [
//           {
//             employeename: employeeid,
//             date: createdate,
//             startdate: startdate,
//             enddate: enddate,
//             reason: reason,
//             requesttype: REQUEST.LEAVE,
//           },
//         ];
//         SendEmailNotification(employeeid,subgroup,REQUEST.LEAVE, emailbody);

//         res.json({ msg: "success" });
//       }
//     });
//   } catch (error) {
//     console.error("Error in /submit route:", error);
//     res.json({ msg: "error" });
//   }
// });

router.post("/submit", async (req, res) => {
  try {
    const {
      employeeid,
      startdate,
      enddate,
      leavetype,
      reason,
      image,
      subgroup,
      durationDays,
      paidDays,
      unpaidDays,
    } = req.body;
    const createdate = moment().format("YYYY-MM-DD HH:mm:ss");
    const status = "Pending";
    const approvedcount = "0";
    console.log("Received request with data:", req.body);

    // const allowedStartDate = moment().add(3, "days").startOf("day");
    // const startDateMoment = moment(startdate);

    // if (startDateMoment.isBefore(allowedStartDate)) {
    //   console.log("Start date is within the 3-day rule");
    //   return res.json({ msg: "not allowed" });
    // }

    const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
    const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

    if (employeeResult.length === 0) {
      console.log("Invalid employee ID");
      return res.json({ msg: "Invalid employee ID" });
    }

    const dateRange = [];
    let currentDate = moment(startdate);
    const endDateMoment = moment(enddate);

    while (currentDate.isSameOrBefore(endDateMoment)) {
      dateRange.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }

    const checkDatesQuery = `
      SELECT ld_leavedates
      FROM leave_dates
      WHERE ld_employeeid = '${employeeid}' AND ld_leavedates IN (${dateRange.map(date => `'${date}'`).join(",")})
    `;
    const existingDatesResult = await mysql.mysqlQueryPromise(checkDatesQuery);

    if (existingDatesResult.length > 0) {
      console.log("Leave dates conflict with existing records:", existingDatesResult);
      return res.json({ msg: "dates_conflict", existingDates: existingDatesResult });
    }
    
    const data = [
      [
        employeeid,
        startdate,
        enddate,
        leavetype,
        reason,
        image,
        status,
        createdate,
        durationDays,
        paidDays,
        unpaidDays,
        subgroup,
        approvedcount,
      ],
    ];

    mysql.InsertTable("leaves", data, (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error inserting leave record:", insertErr);
        res.json({ msg: "insert_failed" });
      } else {
        console.log("Insert result:", insertResult);

        let emailbody = [
          {
            employeename: employeeid,
            date: createdate,
            startdate: startdate,
            enddate: enddate,
            reason: reason,
            status: MessageStatus.APPLIED,
            requesttype: REQUEST.LEAVE,
          },
        ];
        SendEmailNotification(employeeid, subgroup, REQUEST.LEAVE, emailbody);

        res.json({ msg: "success" });
      }
    });
  } catch (error) {
    console.error("Error in /submitleave route:", error);
    res.json({ msg: "error" });
  }
});

router.post("/getleave", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT *,
        ml_leavetype
        FROM leaves
        INNER JOIN master_leaves ON leaves.l_leavetype = ml_id
        WHERE l_employeeid = '${employeeid}'
        ORDER BY l_leaveid DESC`;

    mysql.Select(sql, "Leaves", (err, result) => {
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

router.post("/cancelLeave", async (req, res) => {
  try {
    const leaveid = req.body.leaveid;

    const updateLeaveStatusQuery = `UPDATE leaves SET l_leavestatus = 'Cancelled' WHERE l_leaveid = ${leaveid}`;

    try {
      await mysql.mysqlQueryPromise(updateLeaveStatusQuery, [leaveid]);
      res.json({ msg: "success", leaveid: leaveid, status: "cancelled" });
    } catch (updateError) {
      console.error("Error updating leave status: ", updateError);
      res.json({ msg: "error" });
    }
  } catch (error) {
    console.error("Error in /cancelLeave route: ", error);
    res.json({ msg: "error" });
  }
});

// router.post("/update", (req, res) => {
//   console.log("HIT");
//   try {
//     let leaveid = req.body.leaveid;
//     let status = req.body.status;
//     let leavestartdate = req.body.leavestartdate;
//     let leaveenddate = req.body.leaveenddate;
//     let leaveduration = req.body.leaveduration;
//     let leavereason = req.body.leavereason;
//     let leavepaidays = req.body.leavepaidays;
//     let leaveunpaiddays = req.body.leaveunpaiddays;
//     let comment = req.body.comment;

//     console.log("Received Parameters:");
//     console.log("leaveid:", leaveid);
//     console.log("status:", status);
//     console.log("leavestartdate:", leavestartdate);
//     console.log("leaveenddate:", leaveenddate);
//     console.log("leaveduration:", leaveduration);
//     console.log("leavepaidays:", leavepaidays);
//     console.log("leaveunpaiddays:", leaveunpaiddays);
//     console.log("comment:", comment);

//     let sqlupdate = `UPDATE 
//     leaves SET l_leavestatus = '${status}',
//     l_leavestartdate = '${leavestartdate}',
//     l_leaveenddate = '${leaveenddate}',
//     l_leaveduration = '${leaveduration}',
//     l_leavepaiddays = '${leavepaidays}',
//     l_leaveunpaiddays = '${leaveunpaiddays}',
//     l_leavereason = '${leavereason}',
//     l_comment = '${comment}' 
//     WHERE l_leaveid = '${leaveid}'`;

//     console.log(sqlupdate);

//     mysql
//       .Update(sqlupdate)
//       .then((result) => {
//         console.log(sqlupdate);
//         res.json({
//           msg: "success",
//           data: result,
//         });
//       })
//       .catch((error) => {
//         res.json({
//           msg: "error",
//           data: error,
//         });
//       });
//   } catch (error) {
//     res.json({
//       msg: "error",
//     });
//   }
// });

router.post("/update", async (req, res) => {
  console.log("HIT");
  try {
    const {
      leaveid,
      status,
      leavestartdate,
      leaveenddate,
      leaveduration,
      leavereason,
      leavepaidays,
      leaveunpaiddays,
      comment,
      employeeid,
    } = req.body;

    console.log("Received Parameters:", req.body);
    const conflictQuery = `
      SELECT ld_leavedates 
      FROM leave_dates 
      WHERE ld_employeeid = '${employeeid}'
      AND ld_leavedates BETWEEN '${leavestartdate}' AND '${leaveenddate}'
    `;

    console.log("Checking for date conflicts:", conflictQuery);

    const conflicts = await mysql.mysqlQueryPromise(conflictQuery);

    if (conflicts.length > 0) {
      const conflictingDates = conflicts.map((row) =>
        new Date(row.ld_leavedates).toISOString().split("T")[0]
      );

      console.log("Conflict detected on dates:", conflictingDates);

      return res.json({
        msg: "conflict",
        conflictingDates: conflictingDates,
      });
    }

    const sqlupdate = `
      UPDATE leaves 
      SET 
        l_leavestatus = '${status}',
        l_leavestartdate = '${leavestartdate}',
        l_leaveenddate = '${leaveenddate}',
        l_leaveduration = '${leaveduration}',
        l_leavepaiddays = '${leavepaidays}',
        l_leaveunpaiddays = '${leaveunpaiddays}',
        l_leavereason = '${leavereason}',
        l_comment = '${comment}' 
      WHERE l_leaveid = '${leaveid}'
    `;

    console.log("Executing update:", sqlupdate);

    const updateResult = await mysql.Update(sqlupdate);

    let emailbody = [
      {
        employeename: employeeid,
        date: GetCurrentDatetime(),
        startdate: leavestartdate,
        enddate: leaveenddate,
        reason: comment,
        status: MessageStatus.APPLIED,
        requesttype: REQUEST.LEAVE,
      },
    ];
    SendEmailNotification(employeeid, subgroup, REQUEST.LEAVE, emailbody);

    res.json({
      msg: "success",
      data: updateResult,
    });
  } catch (error) {
    console.error("Error in /update route:", error);
    res.json({
      msg: "error",
      data: error,
    });
  }
});


router.get("/loadleavetype", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT
    ml_id, 
    concat(me_lastname,' ',me_firstname) as ml_employeeid,
    ml_tenure,
    ml_leavetype,
    ml_year,
    ml_totalleavedays,
    ml_unusedleavedays,
    ml_usedleavedays,
    ml_status
    FROM master_leaves
    inner join master_employee on master_leaves.ml_employeeid = me_id
    where ml_employeeid = '${employeeid}'
    and ml_year = YEAR(CURDATE())`;

    mysql.Select(sql, "Master_Leaves", (err, result) => {
      if (err) console.error("Error :", err);

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

router.post("/getunusedleave", (req, res) => {
  try {
    let leavetype = req.body.leavetype;
    let sql = `SELECT
    ml_unusedleavedays
    FROM master_leaves
    WHERE ml_id = '${leavetype}'`;

    mysql.Select(sql, "Master_Leaves", (err, result) => {
      if (err) console.error("Error :", err);

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
