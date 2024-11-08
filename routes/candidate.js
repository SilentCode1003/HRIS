const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('candidatelayout', { title: 'Express' });

  Validator(req, res, "candidatelayout", "candidate");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT
    me_profile_pic AS image,
    me_id AS id,
    CONCAT(me_lastname, ' ', me_firstname) AS name,
    md_departmentname AS me_department,
    me_hiredate AS hiredate,
    CONCAT(
        TIMESTAMPDIFF(YEAR, me_hiredate, CURDATE()), ' years ',
        TIMESTAMPDIFF(MONTH, me_hiredate, CURDATE()) % 12, ' months ',
        DATEDIFF(CURDATE(), DATE_ADD(me_hiredate, INTERVAL TIMESTAMPDIFF(MONTH, me_hiredate, CURDATE()) MONTH)) , ' days'
    ) AS tenure,
    me_jobstatus AS status
    FROM master_employee
    LEFT JOIN master_department md ON master_employee.me_department = md_departmentid
    WHERE me_jobstatus = 'probitionary'
    AND TIMESTAMPDIFF(MONTH, me_hiredate, CURDATE()) >= 6`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          mag: "success",
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
      date: error,
    });
  }
});

router.post("/getcandidate", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `select
    me_profile_pic as profilePicturePath,
    CONCAT(master_employee.me_lastname, " ", master_employee.me_firstname) AS fullname,
     me_hiredate AS hiredate,
      CONCAT(
         TIMESTAMPDIFF(YEAR, me_hiredate, CURDATE()),
         ' years ',
         TIMESTAMPDIFF(MONTH, me_hiredate, CURDATE()) % 12,
         ' months ',
         DATEDIFF(CURDATE(), me_hiredate) % 30,
         ' days'
       ) AS tenure
    from master_employee
    where me_id = '${employeeid}'`;

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

router.post("/update", (req, res) => {
  try {
    let action = req.body.action;
    let employeeid = req.body.employeeid;
    let sql = `UPDATE master_employee SET
    me_jobstatus = '${action}'
    WHERE me_id = '${employeeid}'`;

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
          error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});
