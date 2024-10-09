const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('paymentlayout', { title: 'Express' });
  Validator(req, res, "healthcarddeductionsIDlayout", "healthcarddeductionsID");
});

module.exports = router;

router.post("/getotherdeductionsid", (req, res) => {
  try {
    let otherdeductid = req.body.otherdeductid;
    let sql = `SELECT
      md_employeeid,
      md_idtype,
      md_idnumber,
      md_issuedate,
      md_createby,
      md_status
      FROM master_deductions
      WHERE md_deductionid = '${otherdeductid}'`;

    mysql.Select(sql, "Master_Deductions", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.status(500).json({
      msg: "Internal server error",
      error: error,
    });
  }
});

router.get("/load", (req, res) => {
  try {
    let sql = `    
    SELECT 
md_deductionid,
concat(me_firstname, ' ', me_lastname) AS md_employeeid,
md_idtype,
md_idnumber,
md_issuedate,
md_createby,
md_createdate,
md_status
FROM master_deductions
LEFT JOIN master_employee ON master_deductions.md_employeeid = me_id`;

    mysql.Select(sql, "Master_Deductions", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.post("/save", async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let idtype = req.body.idtype;
    let idnumber = req.body.idnumber;
    let issuedate = req.body.issuedate;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD");
    let status = "Active";
    let data = [];

    const checkQuery = `SELECT * FROM master_deductions WHERE md_employeeid = '${employeeid}' AND md_idtype = '${idtype}'`;
    const checkParams = [employeeid, idtype];

    const existingRecord = await mysql.mysqlQueryPromise(
      checkQuery,
      checkParams
    );

    if (existingRecord.length > 0) {
      res.json({ msg: "exist" });
      return;
    }

    data.push([
      employeeid,
      idtype,
      idnumber,
      issuedate,
      createby,
      createdate,
      status,
    ]);

    mysql.InsertTable("master_deductions", data, (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error inserting record: ", insertErr);
        res.json({ msg: "insert_failed" });
      } else {
        console.log(insertResult);
        res.json({ msg: "success" });
      }
    });
  } catch (error) {
    console.error("Error: ", error);
    res.json({ msg: "error" });
  }
});

router.post("/update", (req, res) => {
  try {
    let otherdeductid = req.body.otherdeductid;
    let employeeid = req.body.employeeid;
    let idtype = req.body.idtype;
    let idnumber = req.body.idnumber;
    let issuedate = req.body.issuedate;
    let createby = req.session.fullname;
    let status = req.body.status;

    let sqlupdate = `UPDATE master_deductions SET   
    md_employeeid ='${employeeid}', 
    md_idtype ='${idtype}', 
    md_idnumber ='${idnumber}',
    md_issuedate ='${issuedate}', 
    md_createby ='${createby}', 
    md_status ='${status}'
    WHERE md_deductionid ='${otherdeductid}'`;

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
