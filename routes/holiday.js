const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();
const Holidays = require("date-holidays");
const {
  UpdateStatement,
  SelectStatement,
  InsertStatement,
} = require("./repository/customhelper");
const {
  JsonWarningResponse,
  MessageStatus,
  JsonSuccess,
  JsonErrorResponse,
} = require("./repository/response");
const { Update, Select, InsertTable } = require("./repository/dbconnect");
const holidaysPH = new Holidays("PH");
const axios = require("axios");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('holidaylayout', { title: 'Express' });
  Validator(req, res, "holidaylayout", "holiday");
});

module.exports = router;
const removeTimeFromDate = (dateStr) => dateStr.split(" ")[0];

const getDayOfWeek = (dateString) =>
  [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][new Date(dateString).getDay()];

const getDOLEType = (holiday) => {
  const specialDaysOfWeek = ["Monday", "Wednesday"];
  const nonWorkingDaysOfWeek = ["Saturday", "Sunday"];

  const dayOfWeek = new Date(holiday.date).toLocaleDateString("en-US", {
    weekday: "long",
  });

  return specialDaysOfWeek.includes(dayOfWeek)
    ? "Special Holiday"
    : nonWorkingDaysOfWeek.includes(dayOfWeek)
    ? "Non-Working Holiday"
    : "Regular Holiday";
};

router.post("/add", (req, res) => {
  try {
    const { date, name, day, type } = req.body;
    let status = 'Incoming';

    let sql = InsertStatement("master_holiday", "mh", [
      "date",
      "name",
      "day",
      "type",
      "status",
    ]);
    let data = [[date, name, day, type, status]];
    let checkStatement = SelectStatement(
      "select * from master_holiday where mh_date=?",
      [date]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              console.log(err);
              res.json(JsonErrorResponse(err));
            }

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/generateholiday", async (req, res) => {
  try {
    const year = req.query.year
      ? parseInt(req.query.year, 10)
      : new Date().getFullYear();

    const existingHolidaysQuery = `SELECT mh_date FROM master_holiday WHERE mh_date LIKE '%${year}%'`;
    const existingHolidays = await mysql.mysqlQueryPromise(
      existingHolidaysQuery
    );

    if (existingHolidays && existingHolidays.length > 0) {
      return res.json({
        msg: "exist",
        data: existingHolidays,
        info: `Holidays for the year ${year} already exist in the database.`,
      });
    }

    const allHolidays = await holidaysPH.getHolidays(year);

    const simplifiedHolidays = allHolidays.map((holiday) => ({
      day: getDayOfWeek(holiday.date),
      date: removeTimeFromDate(holiday.date),
      name: holiday.name,
      type: getDOLEType(holiday),
    }));

    simplifiedHolidays.forEach((holiday) =>
      console.log(
        `${holiday.day} - ${holiday.date} - ${holiday.name} (${holiday.type})`
      )
    );

    res.json({
      msg: "success",
      data: simplifiedHolidays,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Internal server error",
      error: error.message,
    });
  }
});

router.post("/confirmholidays", async (req, res) => {
  try {
    const selectedHolidays = req.body.holidays;

    const allHolidays = await holidaysPH.getHolidays(new Date().getFullYear());
    const holidaysToInsert = allHolidays.filter((holiday) =>
      selectedHolidays.includes(removeTimeFromDate(holiday.date))
    );

    const simplifiedHolidays = holidaysToInsert.map((holiday) => ({
      day: getDayOfWeek(holiday.date),
      date: removeTimeFromDate(holiday.date),
      name: holiday.name,
      type: getDOLEType(holiday),
    }));

    const insertionValues = simplifiedHolidays.map((holiday) => [
      holiday.date,
      holiday.name,
      holiday.day,
      holiday.type,
      new Date(holiday.date) < new Date() ? "Finished" : "Incoming",
    ]);

    mysql.InsertTable("master_holiday", insertionValues, (err, result) => {
      if (err) {
        console.error("Insertion Error:", err);
        return res.status(500).json({
          msg: "Error during insertion",
          error: err.message,
        });
      }
      res.json({
        msg: "success",
        data: simplifiedHolidays,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Internal server error",
      error: error.message,
    });
  }
});

router.get("/load", (req, res) => {
  try {
    let sql = " select * from master_holiday";

    mysql.Select(sql, "Master_Holiday", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.post("/getholiday", (req, res) => {
  try {
    let holidayid = req.body.holidayid;
    let sql = `select *
    from master_holiday
    where mh_holidayid = '${holidayid}'`;

    mysql.Select(sql, "Master_Holiday", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.put("/edit", (req, res) => {
  try {
    const { day, date, name, type, holidayid } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (date) {
      data.push(date);
      columns.push("date");
    }

    if (name) {
      data.push(name);
      columns.push("name");
    }

    if (day) {
      data.push(day);
      columns.push("day");
    }

    if (type) {
      data.push(type);
      columns.push("type");
    }

    if (holidayid) {
      data.push(holidayid);
      arguments.push("holidayid");
    }

    let updateStatement = UpdateStatement(
      "master_holiday",
      "mh",
      columns,
      arguments
    );
    let checkStatement = SelectStatement(
      "select * from master_holiday where mh_date = ? and mh_name = ? and mh_day = ? and mh_type = ?",
      [date, name, day, type]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);
            res.json(JsonSuccess(result));
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

//#region FUNCTION
function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}
//#endregion
