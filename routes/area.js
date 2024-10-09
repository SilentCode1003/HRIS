const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  InsertStatement,
  SelectStatement,
  UpdateStatement,
} = require("./repository/customhelper");
const { InsertTable, Select, Update } = require("./repository/dbconnect");
const { STATUS_LOG } = require("./repository/enums");
const { DataModeling } = require("./model/hrmisdb");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "arealayout", "area");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT * FROM area`;

    Select(sql, (err, results) => {
      if (err) {
        console.error("Error: ", err);
      }

      if (results.length != 0) {
        let data = DataModeling(results, "a_");

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
    const { area } = req.body;
    let status = STATUS_LOG.ACTIVE;
    let sql = InsertStatement("area", "a", ["name", "status"]);
    let data = [[area,status]];

    InsertTable(sql, data, (err, results) => {
      if (err) {
        console.error("Error: ", err);
      }
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

    let cmd = UpdateStatement("area", "a", ["status"], ["id"]);
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


router.post("/edit", (req, res) => {
  try {
    const { id, name } = req.body;
    let update_sql = UpdateStatement(
      "area",
      "a",
      ["name"],
      ["id"]
    );
    let update_data = [name, id];
    Update(update_sql, update_data, (err, results) => {
      if (err) {
        console.error("Error: ", err);
      }

      res.status(200).json({ status: "Success", message: "Data Updated" });
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
});
