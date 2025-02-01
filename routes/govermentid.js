const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, Check } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const {
  GetCurrentDate,
  SelectStatement,
  InsertStatementTransCommit,
  AddDay,
} = require("./repository/customhelper");
const { Transaction, SelectAll } = require("./utility/utility");
const e = require("express");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('govermentidlayout', { title: 'Express' });
  Validator(req, res, "govermentidlayout", "govermentid");
});

module.exports = router;

router.post("/getgovermentid", (req, res) => {
  try {
    let governmentid = req.body.governmentid;
    let sql = `SELECT
      mg_employeeid as employeeid,
      mg_idtype as idtype,
      mg_idnumber as idnumber,
      mg_issuedate as issuedate,
      mg_createby as createby,
      mg_status as status
      FROM master_govid
      WHERE mg_governmentid = '${governmentid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: result,
          });
        } else {
          res.status(404).json({
            msg: "Department not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching department data",
          error: error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Internal server error",
      error: error,
    });
  }
});

router.post("/save", async (req, res) => {
  try {
    const { employeeid, idtype, idnumber, issuedate } = req.body;
    let createby = req.session.fullname;
    let createdate = GetCurrentDate();
    let status = "Active";
    let queries = [];

    async function ProcessData() {
      let checkQuery = SelectStatement(
        "SELECT * FROM master_govid WHERE mg_employeeid = ? AND mg_idtype = ?",
        [employeeid, idtype]
      );
      let existingRecord = await Check(checkQuery);
      if (existingRecord.length > 0) {
        res.json({ msg: "exist" });
        return;
      }

      queries.push({
        sql: InsertStatementTransCommit("master_govid", "mg", [
          "employeeid",
          "idtype",
          "idnumber",
          "issuedate",
          "createby",
          "createdate",
          "status",
        ]),
        values: [
          employeeid,
          idtype,
          idnumber,
          issuedate,
          createby,
          createdate,
          status,
        ],
      });


      let current_cut_off = await GetCurrentCutOff(GetCurrentDate());
      const { cutoff, startdate, enddate, payrolldate } = current_cut_off[0];
      let executionDate = "";

      if (cutoff == "1st Cut Off") {
        executionDate = AddDay(payrolldate, 15);
      } else {
        executionDate = AddDay(payrolldate, 30);
      }

      queries.push({
        sql: InsertStatementTransCommit("deduction_schedule", "ds", [
          "employee_id",
          "description",
          "date",
          "create_by",
          "create_date",
          "status",
        ]),
        values: [
          employeeid,
          idtype,
          executionDate,
          createby,
          createdate,
          status,
        ],
      });

      await Transaction(queries);
      res.status(200).json(JsonSuccess());
    }

    ProcessData();
  } catch (error) {
    console.error("Error: ", error);
    res.json({ msg: "error" });
  }
});

router.get("/load", (req, res) => {
  try {
    let sql = `    
    SELECT 
    mg_governmentid,
    mg_employeeid,
    concat(me_firstname, ' ', me_lastname) AS mg_fullname,
    mg_idtype,
    mg_idnumber,
    mg_issuedate,
    mg_createby,
    mg_createdate,
    mg_status
    FROM master_govid
    LEFT JOIN master_employee ON master_govid.mg_employeeid = me_id`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mg_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.post("/update", (req, res) => {
  try {
    let governmentid = req.body.governmentid;
    let employeeid = req.body.employeeid;
    let idtype = req.body.idtype;
    let idnumber = req.body.idnumber;
    let issuedate = req.body.issuedate;
    let createby = req.session.fullname;
    let status = req.body.status;

    let sqlupdate = `UPDATE master_govid SET   
    mg_employeeid ='${employeeid}', 
    mg_idtype ='${idtype}', 
    mg_idnumber ='${idnumber}',
    mg_issuedate ='${issuedate}', 
    mg_createby ='${createby}', 
    mg_status ='${status}'
    WHERE mg_governmentid ='${governmentid}'`;

    mysql
      .Update(sqlupdate)
      .then((result) => {
        res.json({
          msg: "success",
        });
      })
      .catch((error) => {
        res.json({
          msg: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
    });
  }
});

//#region Functions

function GetCurrentCutOff(date) {
  return new Promise((resolve, reject) => {
    let sql = SelectStatement(
      "select pd_cutoff as cutoff, DATE_FORMAT(pd_startdate, '%Y-%m-%d') as startdate, DATE_FORMAT(pd_enddate, '%Y-%m-%d')  as enddate,  DATE_FORMAT(pd_payrolldate, '%Y-%m-%d')  as payrolldate from payroll_date where pd_payrolldate > ? limit 1",
      [date]
    );

    Select(sql, (error, result) => {
      if (error) return reject(error);

      return resolve(result);
    });
  });
}

//#endregion
