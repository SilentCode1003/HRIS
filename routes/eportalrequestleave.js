const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('eportalrequestleavelayout', { title: 'Express' });
  Validator(req, res, "eportalrequestleavelayout");
});

module.exports = router;

router.post("/submit", async (req, res) => {
  try {
    const employeeid = req.body.employeeid; 
    const { startdate, enddate, leavetype, reason } = req.body;
    const createdate = currentDate.format("YYYY-MM-DD");
    const status = "Pending"; 
    console.log(startdate, enddate, leavetype, reason, employeeid);


    const employeeQuery = `SELECT * FROM master_employee WHERE me_id = '${employeeid}'`;
    const employeeResult = await mysql.mysqlQueryPromise(employeeQuery);

    if (employeeResult.length === 0) {
      return res.json({ msg: "Invalid employee ID" });
    }

    const data = [
      [employeeid, startdate, enddate, leavetype, reason, status, createdate],
    ];

    mysql.InsertTable("leaves", data, (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error inserting leave record: ", insertErr);
        res.json({ msg: "insert_failed" });
      } else {
        console.log(insertResult);
        res.json({ msg: "success" });
      }
    });
  } catch (error) {
    console.error("Error in /submit route: ", error);
    res.json({ msg: "error" });
  }
});

router.get("/load", (req, res) => {
  try {
    let employeeid = req.session.employeeid;
    let sql = `SELECT * FROM leaves WHERE l_employeeid = '${employeeid}'`;

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

router.post("/getleave", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `SELECT *
    FROM leaves
    WHERE l_employeeid = '${employeeid}'
    ORDER BY l_leaveid DESC;`;
    console.log(employeeid);

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

router.post("/update", (req, res) => {
  try {
    let leaveid = req.body.leaveid;
    let status = req.body.status;
    let comment = req.body.comment;

    let sqlupdate = `UPDATE 
    leaves SET l_leavestatus = '${status}', 
    l_comment = '${comment}'  
    WHERE l_leaveid = '${leaveid}'`;

    mysql
      .Update(sqlupdate)
      .then((result) => {
        console.log(sqlupdate);

        res.json({
          msg: "success",
          data: result,
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

module.exports = router;
