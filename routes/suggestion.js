var express = require("express");
var router = express.Router();
const { Validator } = require("./controller/middleware");
const {
  SelectStatement,
  InsertStatement,
  GetCurrentDatetime,
} = require("./repository/customhelper");
const { Select, Insert } = require("./repository/dbconnect");

router.get("/", function (req, res, next) {
  Validator(req, res, "suggestionlayout", "suggestion");
});
module.exports = router;

router.get("/load", function (req, res) {
  try {
    let sql = SelectStatement(
      `select 
        s_id as id,
        concat(me_firstname, ' ', me_lastname) as employee,
        s_date as date,
        sa_name as suggestionarea,
        s_details as details
        from suggestion
        inner join suggestion_area on s_suggestion_area_id = sa_id
        inner join master_employee on s_employee_id = me_id
        order by s_id desc`,
      []
    );

    Select(sql, (err, result) => {
      if (err) {
        res.status(500).json({ msg: err });
      } else {
        res.status(200).json({
          msg: "success",
          data: result,
        });
      }
    });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});

router.post("/save", function (req, res) {
  try {
    const { employeeid, suggestionareaid, details } = req.body;
    const date = GetCurrentDatetime();

    let sql = InsertStatement("suggestion", "s", [
      "employee_id",
      "suggestion_area_id",
      "date",
      "details",
    ]);
    let data = [[employeeid, suggestionareaid, date, JSON.stringify(details)]];

    Insert(sql, data, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ msg: err });
      } else {
        res.status(200).json({
          msg: "success",
        });
      }
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ msg: error });
  }
});

router.get("/getdetails/:id", function (req, res) {
  try {
    const { id } = req.params;
    let sql = SelectStatement(
      "select s_details as details from suggestion where s_id = ?",
      [id]
    );
    Select(sql, (err, result) => {
      if (err) {
        console.log(err);
      }

      res.status(200).json({
        msg: "success",
        data: JSON.parse(result[0].details),
      });
    });
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});
