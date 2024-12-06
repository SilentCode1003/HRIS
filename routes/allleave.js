const mysql = require("./repository/hrmisdb");
//const moment = require('moment');
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
//const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "allleavelayout", "allleave");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql =
      'SELECT leaves.*, CONCAT(master_employee.me_firstname, " ", master_employee.me_lastname) AS l_employeeid FROM leaves JOIN master_employee ON leaves.l_employeeid = master_employee.me_id';

    mysql.Select(sql, "Leaves", (err, result) => {
      if (err) {
        console.error("Error: ", err);
        res.status(500).json({ msg: "Error fetching data" });
        return;
      }

      res.json({ msg: "success", data: result });
    });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Internal server error", error: error.message });
  }
});

router.post("/update", async (req, res) => {
  console.log("HIT");
  try {
    const {
      leaveid,
      status,
      leavestartdate,
      leaveenddate,
      leaveduration,
      leavepaidays,
      leaveunpaiddays,
      comment,
      employeeid,
    } = req.body;

    console.log("Received Parameters:", req.body);

    if (status === "Approved") {
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
        l_comment = '${comment}' 
      WHERE l_leaveid = '${leaveid}'
    `;

    console.log("Executing update:", sqlupdate);

    const updateResult = await mysql.Update(sqlupdate);

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

router.post("/getleavedashboard", (req, res) => {
  try {
    let leaveid = req.body.leaveid;
    let sql = `select 
    concat(me_firstname,' ',me_lastname) as employeeid,
    me_email as email,
    me_gender as gender,
    me_phone as phone,
    l_leavetype as leavetype,
    l_leaveapplieddate as applieddate,
    l_leavestartdate as leavestartdate,
    l_leaveenddate as leaveenddate,
    l_leavereason as reason,
    l_leavestatus as status,
    l_comment as comment
    from leaves
    right join master_employee on leaves.l_employeeid = me_id
    where l_leaveid = '${leaveid}'`;

    mysql
      .mysqlQueryPromise(sql)
      //console.log(sql)
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
    res.json({
      msg: error,
    });
  }
});
