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
  Validator(req, res, "staffhousehistorylayout", "staffhousehistory");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `select 
                sh_id,
                CONCAT(me_firstname, ' ', me_lastname) as sh_employee,
                s_name as sh_staffhouse,
                sh_activity
                from staffhouse_history
                inner join staffhouse_occupant on sh_occupantid = so_staffhouseid
                inner join staffhouse on s_id = so_staffhouseid
                inner join master_employee on me_id =  so_employeeid`;

    Select(sql, (err, result) => {
      if (err) {
        console.log(err);
      }

      if (result.length != 0) {
        let data = DataModeling(result, "sh_");
        console.log(data);
        
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
