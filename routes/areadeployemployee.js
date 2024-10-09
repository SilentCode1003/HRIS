const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  InsertStatement,
  SelectStatement,
  UpdateStatement,
  GetCurrentDate,
} = require("./repository/customhelper");
const { InsertTable, Select, Update } = require("./repository/dbconnect");
const { STATUS_LOG } = require("./repository/enums");
const { DataModeling } = require("./model/hrmisdb");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "areadeployemployeelayout", "areadeployemployee");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
            ade_id,
            CONCAT(me_firstname, " ", me_lastname) as ade_employee,
            a_name as ade_area,
            ade_date,
            ade_status 
            FROM area_deploy_employee
            INNER JOIN master_employee ON ade_employeeid = me_id
            INNER JOIN area ON ade_areaid = a_id`;
    Select(sql, (err, results) => {
      if (err) {
        console.error("Error: ", err);
      }

      if (results.length != 0) {
        let data = DataModeling(results, "ade_");

        res.status(200).json({
          status: "Success",
          data: data,
        });
      } else {
        res.status(200).json({ status: "Success", data: results });
      }
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
});

router.post("/save", (req, res) => {
  try {
    const { area, employee } = req.body;
    let status = STATUS_LOG.ACTIVE;
    let date = GetCurrentDate();
    let sql = InsertStatement("area_deploy_employee", "ade", [
      "areaid",
      "employeeid",
      "date",
      "status",
    ]);
    let data = [[area, employee, date, status]];

    InsertTable(sql, data, (err, results) => {
      if (err) {
        console.error("Error: ", err);
      }
      console.log(results);

      let history = InsertStatement("deploy_history_employee", "dhe", [
        "areadeployid",
        "date",
        "status",
      ]);
      let history_data = [[results[0].id, date, status]];

      InsertTable(history, history_data, (err, results) => {
        if (err) {
          console.error("Error: ", err);
        }
      });

      console.log(results);

      res.status(200).json({ status: "Success", message: "Data Saved" });
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
});

router.post("/status", function (req, res, next) {
  try {
    const { id, status } = req.body;
    let status_new =
      status == "Active" ? STATUS_LOG.INACTIVE : STATUS_LOG.ACTIVE;

    let cmd = UpdateStatement(
      "area_deploy_employee",
      "ade",
      ["status"],
      ["id"]
    );
    let data = [status_new, id];

    Update(cmd, data, (err, result) => {
      if (err) {
        console.log(err);
      }

      console.log(result);
    });

    res.status(200).json({
      status: "Success",
      message: "Data updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: error,
    });
  }
});