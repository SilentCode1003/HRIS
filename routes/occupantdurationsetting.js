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
  Validator(
    req,
    res,
    "occupantdurationsettinglayout",
    "occupantdurationsetting"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = "SELECT * FROM `occupant_duration_settings`";

    Select(sql, (err, result) => {
      if (err) {
        console.log(err);
      }

      if (result.length != 0) {
        let data = DataModeling(result, "ods_");
        res.status(200).json({
          status: "Success",
          data: data,
        });
      } else {
        res.status(200).json({
          status: "Success",
          data: result,
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: error,
    });
  }
});

router.post("/save", function (req, res, next) {
  try {
    const { data } = req.body;
    let status = STATUS_LOG.ACTIVE;

    Check(data[0].name).then((result) => {
      if (result.length != 0) {
        res.status(200).json({
          status: "Exist",
          message: `${data[0].name} is already exist`,
        });
      } else {
        for (const d of data) {
          const { name, duration } = d;

          let sql = InsertStatement("occupant_duration_settings", "ods", [
            "name",
            "duration",
            "status",
          ]);
          let values = [[name, duration, status]];

          InsertTable(sql, values, (err, result) => {
            if (err) {
              console.log(err);
            }
          });
        }

        res.status(200).json({
          status: "Success",
          message: "Data saved successfully",
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: error,
    });
  }
});

router.post("/status", function (req, res, next) {
  try {
    const { id, status } = req.body;

    let cmd = UpdateStatement(
      "occupant_duration_settings",
      "ods",
      ["status"],
      ["id"]
    );
    let data = [
      status == "Active" ? STATUS_LOG.INACTIVE : STATUS_LOG.ACTIVE,
      id,
    ];

    Update(cmd, data, (err, result) => {
      if (err) {
        console.log(err);
      }
      res.status(200).json({
        status: "Success",
        message: "Data updated successfully",
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: error,
    });
  }
});

router.post("/update", function (req, res, next) {
  try {
    const { id, name, duration } = req.body;
    let cmd = UpdateStatement(
      "occupant_duration_settings",
      "ods",
      ["name", "duration"],
      ["id"]
    );
    let data = [name, duration, id];

    Update(cmd, data, (err, result) => {
      if (err) {
        console.log(err);
      }

      res.status(200).json({
        status: "Success",
        message: "Data updated successfully",
      });
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: error,
    });
  }
});

//#region Functions

function Check(name) {
  return new Promise((resolve, reject) => {
    let sql = "SELECT * FROM occupant_duration_settings WHERE ods_name = ?";
    let cmd = SelectStatement(sql, [name]);

    Select(cmd, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}

//#endregion
