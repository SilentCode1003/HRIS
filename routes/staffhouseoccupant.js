const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  InsertStatement,
  SelectStatement,
  UpdateStatement,
  GetCurrentDatetime,
} = require("./repository/customhelper");
const { InsertTable, Select, Update } = require("./repository/dbconnect");
const { STATUS_LOG } = require("./repository/enums");
const { DataModeling } = require("./model/hrmisdb");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "staffhouseoccupantlayout", "staffhouseoccupant");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    so_id,
    s_name as so_staffhouseid,
    CONCAT(me_firstname, ' ', me_lastname) as so_employeeid,
    CASE WHEN DATEDIFF(so_enddate, CURRENT_DATE) < 0 THEN 'OVER STAYING' ELSE CONCAT(DATEDIFF(so_enddate,CURRENT_DATE), ' DAYS REMAING') END AS so_durationstatus,
    so_startdate,
    so_enddate,
    so_status
    FROM staffhouse_occupant
    INNER JOIN staffhouse ON s_id = so_staffhouseid
    INNER JOIN master_employee ON me_id = so_employeeid`;

    Select(sql, (err, result) => {
      if (err) {
        console.log(err);
      }

      if (result.length != 0) {
        let data = DataModeling(result, "so_");
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

router.post("/save", (req, res) => {
  try {
    const { staffhouse, employee, startdate, enddate } = req.body;
    let status = STATUS_LOG.ACTIVE;

    let sql = InsertStatement("staffhouse_occupant", "so", [
      "staffhouseid",
      "employeeid",
      "startdate",
      "enddate",
      "status",
    ]);

    let data = [[staffhouse, employee, startdate, enddate, status]];

    let sql_history = InsertStatement("staffhouse_history", "sh", [
      "occupantid",
      "activity",
    ]);

    Check(employee).then((result) => {
      if (result.length != 0) {
        res.status(200).json({
          status: "Error",
          message: "Occupant Already Exist!",
        });
      } else {
        InsertTable(sql, data, (err, result) => {
          if (err) {
            console.log(err);
          }

          let occupantid = result[0].id;
          let history = [[occupantid, `Registered ${GetCurrentDatetime()}`]];

          InsertTable(sql_history, history, (err, result) => {
            if (err) {
              console.log(err);
            }
          });

          res.status(200).json({
            status: "Success",
            message: result,
          });
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
    let status_new =
      status == "Active" ? STATUS_LOG.INACTIVE : STATUS_LOG.ACTIVE;

    let cmd = UpdateStatement("staffhouse_occupant", "so", ["status"], ["id"]);
    let data = [status_new, id];

    let sql_history = InsertStatement("staffhouse_history", "sh", [
      "occupantid",
      "activity",
    ]);
    let history_data = [
      [id, `Status change to ${status_new} dated ${GetCurrentDatetime()}`],
    ];

    Update(cmd, data, (err, result) => {
      if (err) {
        console.log(err);
      }

    });

    InsertTable(sql_history, history_data, (err, result) => {
      if (err) {
        console.log(err);
      }
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

router.post("/transfer", function (req, res, next) {
  try {
    const { id, staffhouse, staffhousename } = req.body;
    let cmd = UpdateStatement(
      "staffhouse_occupant",
      "so",
      ["staffhouseid"],
      ["id"]
    );
    let data = [staffhouse, id];

    Update(cmd, data, (err, result) => {
      if (err) {
        console.log(err);
      }

      let sql_history = InsertStatement("staffhouse_history", "sh", [
        "occupantid",
        "activity",
      ]);
      let history_data = [
        [id, `Transfered to ${staffhousename} dated ${GetCurrentDatetime()}`],
      ];

      InsertTable(sql_history, history_data, (err, result) => {
        if (err) {
          console.log(err);
        }

      });

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

router.post("/datechange", function (req, res, next) {
  try {
    const { id, startdate, enddate } = req.body;
    let cmd = UpdateStatement(
      "staffhouse_occupant",
      "so",
      ["startdate", "enddate"],
      ["id"]
    );
    let data = [startdate, enddate, id];

    Update(cmd, data, (err, result) => {
      if (err) {
        console.log(err);
      }

      let sql_history = InsertStatement("staffhouse_history", "sh", [
        "occupantid",
        "activity",
      ]);
      let history_data = [
        [
          id,
          `Date changed from ${startdate} to ${enddate} dated ${GetCurrentDatetime()}`,
        ],
      ];

      InsertTable(sql_history, history_data, (err, result) => {
        if (err) {
          console.log(err);
        }

      });
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

function Check(value) {
  return new Promise((resolve, reject) => {
    let sql = "SELECT * FROM staffhouse_occupant WHERE so_employeeid = ?";
    let cmd = SelectStatement(sql, [value]);

    Select(cmd, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}

//#endregion
