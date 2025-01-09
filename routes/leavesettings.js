const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const e = require("express");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
  JsonWarningResponse,
  MessageStatus,
} = require("./repository/response");
const { Select, InsertTable, Insert, Update } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { InsertStatement, SelectStatement, UpdateStatement, GetCurrentYear } = require("./repository/customhelper");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('interestlayout', { title: 'Express' });
  Validator(req, res, "leavesettingslayout", "leavesettings");
});

module.exports = router;

//#region With Paid Leaves

router.get("/load", (req, res) => {
  try {
    let year = GetCurrentYear();
    let sql = `SELECT
    ml_id, 
    concat(me_lastname,' ',me_firstname) AS ml_employeeid,
    ml_tenure,
    ml_leavetype,
    ml_year,
    ml_totalleavedays,
    ml_unusedleavedays,
    ml_usedleavedays,
    ml_status
    FROM master_leaves
    INNER JOIN master_employee ON master_leaves.ml_employeeid = me_id
    WHERE ml_leave_pay = TRUE
    and ml_year = '${year}'`;

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

router.post("/setleave", async (req, res) => {
  try {
    let totalleave = req.body.totalleave;
    let yearleave = req.body.yearleave;
    let leavetype = req.body.leavetype;
    const checkQuery = `SELECT COUNT(*) AS count FROM master_leaves WHERE ml_year = '${yearleave}' AND ml_leavetype = '${leavetype}'`;

    const existingRecord = await mysql.mysqlQueryPromise(checkQuery);

    if (existingRecord.length > 0 && existingRecord[0].count > 0) {
      res.json({ msg: "exist" });
    } else {
      let sql = `CALL hrmis.CreateLeave(${totalleave}, ${yearleave}, '${leavetype}')`;

      mysql.StoredProcedure(sql, (err, result) => {
        if (err) {
          console.error("Error calling stored procedure: ", err);
          res.json({
            msg: "error",
            data: err,
          });
        } else {
          res.json({
            msg: "success",
            data: result,
          });
        }
      });
    }
  } catch (error) {
    console.error("Error: ", error);
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/setleaveperemployee", async (req, res) => {
  try {
    let totalleave = req.body.totalleave;
    let yearleave = req.body.yearleave;
    let leavetype = req.body.leavetype;
    let employeeid = req.body.employeeid;

    const checkQuery = `SELECT COUNT(*) AS count FROM master_leaves 
    WHERE ml_year = '${yearleave}' 
    AND ml_leavetype = '${leavetype}'
    AND ml_employeeid = '${employeeid}'`;

    const existingRecord = await mysql.mysqlQueryPromise(checkQuery);

    if (existingRecord.length > 0 && existingRecord[0].count > 0) {
      res.json({ msg: "exist" });
    } else {
      let sql = `call hrmis.CreateLeavePerEmployee
      (${totalleave}, ${yearleave}, '${leavetype}', '${employeeid}')`;

      mysql.StoredProcedure(sql, (err, result) => {
        if (err) {
          console.error("Error calling stored procedure: ", err);
          res.json({
            msg: "error",
            data: err,
          });
        } else {
          res.json({
            msg: "success",
            data: result,
          });
        }
      });
    }
  } catch (error) {
    console.error("Error: ", error);
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/getleavedates", (req, res) => {
  try {
    let leavesettingsid = req.body.leavesettingsid;
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
    WHERE ml_id = '${leavesettingsid}'
    `;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ld_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getleavesettings", (req, res) => {
  try {
    let leavesettingsid = req.body.leavesettingsid;
    let sql = `select * from master_leaves
    where ml_id = '${leavesettingsid}'`;

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

router.post("/update", (req, res) => {
  try {
    let leavesettingsid = req.body.leavesettingsid;
    let employeeid = req.body.employeeid;
    let leavetype = req.body.leavetype;
    let yearleave = req.body.yearleave;
    let totalleave = req.body.totalleave;
    let unusedleave = req.body.unusedleave;
    let usedleave = req.body.usedleave;

    let sqlupdate = `UPDATE master_leaves SET   
    ml_employeeid = '${employeeid}',
    ml_leavetype  = '${leavetype}',
    ml_year = '${yearleave}',
    ml_totalleavedays = '${totalleave}',
    ml_unusedleavedays = '${unusedleave}',
    ml_usedleavedays = '${usedleave}'
    WHERE ml_id ='${leavesettingsid}'`;

    mysql
      .Update(sqlupdate)
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

//#endregion 


//#region With Out Paid Leaves

router.get("/loadnopaid", (req, res) => {
  try {
    let year = GetCurrentYear();
    let sql = `SELECT
    ml_id, 
    concat(me_lastname,' ',me_firstname) AS ml_employeeid,
    ml_tenure,
    ml_leavetype,
    ml_year,
    ml_totalleavedays,
    ml_unusedleavedays,
    ml_usedleavedays,
    ml_status
    FROM master_leaves
    INNER JOIN master_employee ON master_leaves.ml_employeeid = me_id
    WHERE ml_leave_pay = FALSE
    and ml_year = '${year}'`;

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

router.post("/addleavenopaid", async (req, res) => {
  try {
    const { yearleave, leavetype } = req.body;
    let GetAllEmpId = `SELECT me_id FROM master_employee WHERE me_jobstatus = 'regular'`;

    const employeeIds = await mysql.mysqlQueryPromise(GetAllEmpId);

    for (const employee of employeeIds) {
      let employeeId = employee.me_id;

      let sql = InsertStatement("master_leaves", "ml", [
        "employeeid",
        "tenure",
        "leavetype",
        "year",
        "totalleavedays",
        "unusedleavedays",
        "usedleavedays",
        "status",
        "leave_pay",
      ]);

      let data = [
        [
          employeeId,
          yearleave,
          leavetype,
          yearleave,
          0,
          0,
          0,
          "Without Paid Leaves",
          false,
        ],
      ];

      let checkStatement = SelectStatement(
        "select * from master_leaves where ml_employeeid=? and ml_year=? and ml_leavetype=?",
        [employeeId, yearleave, leavetype]
      );

      const result = await Check(checkStatement);

      if (result != 0) {
        return res.json(JsonWarningResponse(MessageStatus.EXIST));
      } else {
        await new Promise((resolve, reject) => {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      }
    }

    res.json(JsonSuccess());
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/setleaveperemployeenopaid", async (req, res) => {
  try {
   const { yearleave, leavetype, employeeid } = req.body;

    let sql = InsertStatement("master_leaves", "ml", [
      "employeeid",
      "tenure",
      "leavetype",
      "year",
      "totalleavedays",
      "unusedleavedays",
      "usedleavedays",
      "status",
      "leave_pay",
    ]);

    let data = [
      [
        employeeid,
        yearleave,
        leavetype,
        yearleave,
        0,
        0,
        0,
        "Without Paid Leaves",
        false,
      ],
    ];

    let checkStatement = SelectStatement(
      "select * from master_leaves where ml_employeeid=? and ml_year=? and ml_leavetype=?",
      [employeeid, yearleave, leavetype]
    );

    Check(checkStatement)
    .then((result) => {
      if (result != 0) {
        return res.json(JsonWarningResponse(MessageStatus.EXIST));
      } else {
        Insert(sql, data, (err, result) => {
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
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/updatenopaid", (req, res) => {
  try {
    const { leavesettingsid, employeeid, leavetype, yearleave} = req.body;

    let data = [];
    let columns = [];
    let arguments = [];


    if (yearleave) {
      data.push(yearleave);
      columns.push("year");
    }

    if (leavetype) {
      data.push(leavetype);
      columns.push("leavetype");
    }

    if (leavesettingsid) {
      data.push(leavesettingsid);
      arguments.push("id");
    }

    let checkStatement = SelectStatement(
      "select * from master_leaves where ml_employeeid = ? and ml_leavetype = ? and ml_year = ?",
      [employeeid, leavetype, yearleave]
    );


    let updateStatement = UpdateStatement(
      "master_leaves",
      "ml",
      columns,
      arguments
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
   res.json(JsonErrorResponse(error))
  }
});

router.post("/getleavedatesnopaid", (req, res) => {
  try {
    let leavesettingsid = req.body.leavesettingsid;
    let sql = `
    SELECT
    ld_dateid as ld_datenopaid, 
    CONCAT(me_lastname,' ',me_firstname) AS ld_fullnamenopaid,
    DATE_FORMAT(ld_leavedates, '%Y-%m-%d') AS ld_leavedatesnopaid,
    DATE_FORMAT(ld_leavedates, '%W') AS ld_day_namenopaid,
    ml_leavetype AS ld_leavetypenopaid,
    ml_year AS ld_yearnopaid,
    DATE_FORMAT(ld_payrolldate, '%Y-%m-%d') AS ld_payrolldatenopaid
    FROM leave_dates
    INNER JOIN master_leaves ON leave_dates.ld_leavetype = ml_id
    INNER JOIN master_employee ON leave_dates.ld_employeeid = me_id
    WHERE ml_id = '${leavesettingsid}'
    `;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ld_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});


//#endregion


//#region Functions

function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}

//#endregion

