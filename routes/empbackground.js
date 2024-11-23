const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const e = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "empbackgroundlayout", "empbackground");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT
    meb_id,
    CONCAT(me_lastname, ' ', me_firstname) AS meb_employeeid,
    meb_type,
    meb_attainment,
    meb_tittle,
    meb_status,
    meb_start,
    meb_end
    FROM
    master_employee_background 
    INNER JOIN
    master_employee  ON meb_employeeid = me_id`;

    mysql.Select(sql, "Master_Employee_Background", (err, result) => {
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

router.post("/save", (req, res) => {
  try {
    let educationData = JSON.parse(req.body.educationData);
    let experienceData = JSON.parse(req.body.experienceData);

    let employeeRecords = [];

    for (let education of educationData) {
      if (
        education.employeeName &&
        education.schoolName &&
        education.course &&
        education.schoolAttainment &&
        education.schoolAchievements &&
        education.startYear &&
        education.endYear
      ) {
        employeeRecords.push([
          education.employeeName,
          "Educational Background",
          education.course,
          education.schoolName,
          education.schoolAttainment,
          education.schoolAchievements,
          education.startYear,
          education.endYear,
        ]);
      }
    }

    for (let experience of experienceData) {
      if (
        experience.employeeName &&
        experience.companyName &&
        experience.workstatus &&
        experience.workAttainment &&
        experience.workTittle &&
        experience.workStartYear &&
        experience.workEndYear
      ) {
        employeeRecords.push([
          experience.employeeName,
          "Work Background",
          experience.workstatus,
          experience.companyName,
          experience.workAttainment,
          experience.workTittle,
          experience.workStartYear,
          experience.workEndYear,
        ]);
      }
    }

    if (employeeRecords.length === 0) {
      res.json({ msg: "nodata" });
      return;
    }

    mysql.InsertTable(
      "master_employee_background",
      employeeRecords,
      (err, result) => {
        if (err) {
          console.error("Error inserting records: ", err);
          res.json({ msg: "Insert failed" });
        } else {
          res.json({ msg: "success" });
        }
      }
    );
  } catch (error) {
    res.json({
      msg: "Error",
      data: error,
    });
  }
});

router.post("/getbackground", (req, res) => {
  try {
    let backgroundid = req.body.backgroundid;
    let sql = `SELECT
    meb_id,
  	meb_employeeid,
    meb_type,
    meb_attainment,
    meb_tittle,
    meb_status,
    meb_start,
    meb_end
    FROM
    master_employee_background 
    INNER JOIN
    master_employee  ON meb_employeeid = me_id
    where meb_id = '${backgroundid}'`;

    mysql.Select(sql, "Master_Employee_Background", (err, result) => {
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
    let backgroundid = req.body.backgroundid;
    let backstatus = req.body.backstatus;
    let tittle = req.body.tittle;
    let attainment = req.body.attainment;
    let start = req.body.start;
    let end = req.body.end;

    let sql = `UPDATE master_employee_background SET 
    meb_status = '${backstatus}',
    meb_tittle = '${tittle}',
    meb_attainment = '${attainment}',
    meb_start = '${start}',
    meb_end = '${end}'
    WHERE meb_id = '${backgroundid}'`;

    mysql
      .Update(sql)
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
      data: error,
    });
  }
});
