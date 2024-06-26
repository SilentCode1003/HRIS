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

router.post("/update", (req, res) => {
  console.log("HIT");
  try {
    let leaveid = req.body.leaveid;
    let status = req.body.status;
    let leavestartdate = req.body.leavestartdate;
    let leaveenddate = req.body.leaveenddate;
    let leaveduration = req.body.leaveduration;
    let leavepaidays = req.body.leavepaidays;
    let leaveunpaiddays = req.body.leaveunpaiddays;
    let comment = req.body.comment;

    console.log("Received Parameters:");
    console.log("leaveid:", leaveid);
    console.log("status:", status);
    console.log("leavestartdate:", leavestartdate);
    console.log("leaveenddate:", leaveenddate);
    console.log("leaveduration:", leaveduration);
    console.log("leavepaidays:", leavepaidays);
    console.log("leaveunpaiddays:", leaveunpaiddays);
    console.log("comment:", comment);

    let sqlupdate = `UPDATE 
    leaves SET l_leavestatus = '${status}',
    l_leavestartdate = '${leavestartdate}',
    l_leaveenddate = '${leaveenddate}',
    l_leaveduration = '${leaveduration}',
    l_leavepaiddays = '${leavepaidays}',
    l_leaveunpaiddays = '${leaveunpaiddays}',
    l_comment = '${comment}' 
    WHERE l_leaveid = '${leaveid}'`;

    console.log(sqlupdate);

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
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
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
