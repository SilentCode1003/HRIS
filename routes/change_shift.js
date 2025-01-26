const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, InsertTable, Update } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonWarningResponse,
  MessageStatus,
  JsonSuccess,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const {
  InsertStatement,
  SelectStatement,
  UpdateStatement,
  GetCurrentDatetime,
  InsertStatementTransCommit,
} = require("./repository/customhelper");
const { log } = require("winston");
const { Transaction } = require("./utility/utility");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "change_shiftlayout", "change_shift");
});

module.exports = router;
//#region change Rest Day

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    cs_id,
    concat(me_lastname,' ',me_firstname) as cs_fullname,
    cs_actualrd,
    cs_changerd,
    cs_createby,
    cs_shiftstatus
    FROM change_shift
    INNER JOIN master_employee on change_shift.cs_employeeid = me_id`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "cs_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});

// router.post("/save", async (req, res) => {
//   try {
//     let createby = req.session.fullname;
//     let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
//     let status = "Active";
//     const { employeeid, targetrddate, actualrddate } = req.body;

//     let sql = InsertStatement("change_shift", "cs", [
//       "employeeid",
//       "actualrd",
//       "changerd",
//       "shiftstatus",
//       "createby",
//       "createdate",
//     ]);
//     let data = [
//       [employeeid, actualrddate, targetrddate, status, createby, createdate],
//     ];

//     let checkStatement = SelectStatement(
//       "select * from change_shift where cs_employeeid =? and cs_actualrd=? or cs_employeeid =? and  cs_changerd =?",
//       [employeeid, actualrddate, employeeid, targetrddate]
//     );
//     Check(checkStatement)
//       .then((result) => {
//         if (result != 0) {
//           return res.json(JsonWarningResponse(MessageStatus.EXIST));
//         } else {
//           InsertTable(sql, data, (err, result) => {
//             if (err) {
//               console.log(err);
//               res.json(JsonErrorResponse(err));
//             }

//             res.json(JsonSuccess());
//           });
//         }
//       })
//       .catch((error) => {
//         console.log(error);
//         res.json(JsonErrorResponse(error));
//       });
//   } catch (error) {
//     console.log(err);
//     res.json(JsonErrorResponse(error));
//   }
// });

// router.post("/save", async (req, res) => {
//   try {
//     let createby = req.session.fullname;
//     let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
//     let status = "Active";
//     const { employeeid, targetrddate, actualrddate } = req.body;

//     if (!employeeid || !targetrddate || !actualrddate) {
//       return res.json(JsonWarningResponse("Employee ID, Actual RD Date, and Target RD Date are required"));
//     }

//     let sql = InsertStatement("change_shift", "cs", [
//       "employeeid",
//       "actualrd",
//       "changerd",
//       "shiftstatus",
//       "createby",
//       "createdate",
//     ]);
//     let data = [
//       [employeeid, actualrddate, targetrddate, status, createby, createdate],
//     ];

//     let checkStatement = SelectStatement(
//       "SELECT * FROM change_shift WHERE (cs_employeeid = ? AND cs_actualrd = ?) OR (cs_employeeid = ? AND cs_changerd = ?)",
//       [employeeid, actualrddate, employeeid, targetrddate]
//     );

//     const result = await Check(checkStatement);

//     if (result.length > 0) {
//       return res.json(JsonWarningResponse(MessageStatus.EXIST));
//     }

//     InsertTable(sql, data, (err, result) => {
//       if (err) {
//         console.log(err);
//         return res.json(JsonErrorResponse(err));
//       }

//       return res.json(JsonSuccess());
//     });

//   } catch (error) {
//     console.log(error);
//     res.json(JsonErrorResponse(error));
//   }
// });

router.post("/save", (req, res) => {
  try {
    let createby = req.session.fullname;
    let createdate = GetCurrentDatetime();
    let status = "Active";
    const { employeeid, targetrddate, actualrddate } = req.body;
    let queries = [];

    async function ProcessData() {
      let checkActual = SelectStatement(
        "SELECT * FROM change_shift WHERE cs_employeeid = ? AND cs_actualrd = ?",
        [employeeid, actualrddate]
      );

      let checkTarget = SelectStatement(
        "SELECT * FROM change_shift WHERE cs_employeeid = ? AND cs_changerd = ?",
        [employeeid, targetrddate]
      );

      let getShiftTargetRestday = `
      SELECT 
      CASE
        WHEN DAYOFWEEK('${targetrddate}') = 2 THEN (ms.ms_MONDAY->>'$.time_in')
        WHEN DAYOFWEEK('${targetrddate}') = 3 THEN (ms.ms_TUESDAY->>'$.time_in')
        WHEN DAYOFWEEK('${targetrddate}') = 4 THEN (ms.ms_WEDNESDAY->>'$.time_in')
        WHEN DAYOFWEEK('${targetrddate}') = 5 THEN (ms.ms_THURSDAY->>'$.time_in')
        WHEN DAYOFWEEK('${targetrddate}') = 6 THEN (ms.ms_FRIDAY->>'$.time_in')
        WHEN DAYOFWEEK('${targetrddate}') = 7 THEN (ms.ms_SATURDAY->>'$.time_in')
        WHEN DAYOFWEEK('${targetrddate}') = 1 THEN (ms.ms_SUNDAY->>'$.time_in')
      END as schedule_time_in,
      CASE 
        WHEN DAYOFWEEK('${targetrddate}') = 2 THEN (ms.ms_MONDAY->>'$.time_out')
        WHEN DAYOFWEEK('${targetrddate}') = 3 THEN (ms.ms_TUESDAY->>'$.time_out')
        WHEN DAYOFWEEK('${targetrddate}') = 4 THEN (ms.ms_WEDNESDAY->>'$.time_out')
        WHEN DAYOFWEEK('${targetrddate}') = 5 THEN (ms.ms_THURSDAY->>'$.time_out')
        WHEN DAYOFWEEK('${targetrddate}') = 6 THEN (ms.ms_FRIDAY->>'$.time_out')
        WHEN DAYOFWEEK('${targetrddate}') = 7 THEN (ms.ms_SATURDAY->>'$.time_out')
        WHEN DAYOFWEEK('${targetrddate}') = 1 THEN (ms.ms_SUNDAY->>'$.time_out')
      END as schedule_time_out
      FROM master_shift as ms
      INNER JOIN master_employee on me_id = ms_employeeid
      WHERE me_id = '${employeeid}'`;

      const actualResult = await Check(checkActual);
      const targetResult = await Check(checkTarget);
      const targetRestdayResult = await Check(getShiftTargetRestday);
      console.log(actualResult, targetResult, targetRestdayResult);

      const { schedule_time_in, schedule_time_out } = targetRestdayResult[0];

      console.log(schedule_time_in, schedule_time_out);

      if (actualResult.length > 0) {
        return res.json("Actual Date Exist");
      }

      if (targetResult.length > 0) {
        return res.json("Target Date Exist");
      }
      if (schedule_time_in == schedule_time_out) {
        return res.json("Target rest day time is same as actual rest day time");
      }

      //#region Change Shift Insert
      const insertChangeSfhit = InsertStatementTransCommit(
        "change_shift",
        "cs",
        [
          "employeeid",
          "actualrd",
          "changerd",
          "shiftstatus",
          "createby",
          "createdate",
        ]
      );
      const chageShiftData = [
        employeeid,
        actualrddate,
        targetrddate,
        status,
        createby,
        createdate,
      ]

      queries.push({
        sql: insertChangeSfhit,
        values: chageShiftData,
      });

      //#endregion

      //#region Master Attendance Update

      const updateMasterAttendance = UpdateStatement(
        "master_attendance",
        "ma",
        ["shift_timein", "shift_timeout"],
        ["employeeid", "attendancedate"]
      );

      console.log(updateMasterAttendance);
      

      queries.push({
        sql: updateMasterAttendance,
        values: [schedule_time_in, schedule_time_out, employeeid, actualrddate],
      });

     await Transaction(queries);

      res.json(JsonSuccess());
    }

    ProcessData();
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getchange_shift", (req, res) => {
  try {
    let changeshift = req.body.changeshift;
    let sql = `SELECT
    cs_id,
    cs_employeeid,
    cs_actualrd,
    cs_changerd,
    cs_shiftstatus,
    cs_createby,
    cs_createdate
    FROM change_shift
    WHERE cs_id = '${changeshift}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "cs_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(err));
  }
});

router.put("/edit", async (req, res) => {
  try {
    const { changeshift, employeeid, actualrd, changerd, shiftstatus } =
      req.body;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");

    let data = [];
    let columns = [];
    let arguments = [];

    if (employeeid) {
      data.push(employeeid);
      columns.push("employeeid");
    }

    if (actualrd) {
      data.push(actualrd);
      columns.push("actualrd");
    }

    if (changerd) {
      data.push(changerd);
      columns.push("changerd");
    }

    if (shiftstatus) {
      data.push(shiftstatus);
      columns.push("shiftstatus");
    }

    if (createby) {
      data.push(createby);
      columns.push("createby");
    }

    if (createdate) {
      data.push(createdate);
      columns.push("createdate");
    }

    if (changeshift) {
      data.push(changeshift);
      arguments.push("id");
    }

    let updateStatement = UpdateStatement(
      "change_shift",
      "cs",
      columns,
      arguments
    );

    let checkActual = SelectStatement(
      "SELECT * FROM change_shift WHERE cs_employeeid = ? AND cs_actualrd = ?",
      [employeeid, actualrd]
    );

    let checkTarget = SelectStatement(
      "SELECT * FROM change_shift WHERE cs_employeeid = ? AND cs_changerd = ?",
      [employeeid, changerd]
    );

    const actualResult = await Check(checkActual);
    const targetResult = await Check(checkTarget);

    if (actualResult.length > 0) {
      return res.json("Actual Date Exist");
    }

    if (targetResult.length > 0) {
      return res.json("Target Date Exist");
    }

    Update(updateStatement, data, (err, result) => {
      if (err) console.error("Error: ", err);

      res.json(JsonSuccess());
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

//#endregion

//#region change Shift Time

router.get("/loadshifttime", (req, res) => {
  try {
    let sql = `SELECT 
    cst_id,
    concat(me_lastname,' ',me_firstname) as cst_fullname,
    cst_target_date,
    cst_original_shift,
    cst_changed_shift,
    cst_status,
    cst_createby,
    cst_createdate
    FROM change_shift_time
    INNER JOIN master_employee on change_shift_time.cst_employeeid = me_id`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "cst_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getshift", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let dayname = req.body.dayname;

    console.log(employeeid, dayname);

    let sql = `
      SELECT 
          CASE 
              WHEN '${dayname}' = 'Monday' THEN ms_monday
              WHEN '${dayname}' = 'Tuesday' THEN ms_tuesday
              WHEN '${dayname}' = 'Wednesday' THEN ms_wednesday
              WHEN '${dayname}' = 'Thursday' THEN ms_thursday
              WHEN '${dayname}' = 'Friday' THEN ms_friday
              WHEN '${dayname}' = 'Saturday' THEN ms_saturday
              WHEN '${dayname}' = 'Sunday' THEN ms_sunday
          END AS ms_shift
      FROM master_shift
      WHERE ms_employeeid = '${employeeid}'`;
    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        return res.json(JsonErrorResponse(err));
      }

      if (result.length > 0) {
        const transformedData = result.map((row) => transformShiftData(row));
        res.json(JsonDataResponse(transformedData));
      } else {
        res.json(JsonDataResponse([]));
      }
    });
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

//#endregion

//#region FUNCTION
function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}

const transformShiftData = (data) => {
  try {
    const shiftData = JSON.parse(data.ms_shift);
    return {
      time_in: shiftData.time_in,
      time_out: shiftData.time_out,
    };
  } catch (error) {
    console.error("Error parsing shift data:", error);
    return null;
  }
};

//#endregion
