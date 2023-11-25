const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();
const Holidays = require("date-holidays");
const holidaysPH = new Holidays("PH");

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('holidaylayout', { title: 'Express' });
  Validator(req, res, "holidaylayout");
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

router.post("/generateholiday", async (req, res) => {
  try {
    const year = req.query.year
      ? parseInt(req.query.year, 10)
      : new Date().getFullYear();
    console.log(`Requested Year: ${year}`);

    const existingHolidaysQuery = `SELECT mh_date FROM master_holiday WHERE mh_date LIKE '%${year}%'`;
    const existingHolidays = await mysql.mysqlQueryPromise(
      existingHolidaysQuery
    );

    if (existingHolidays && existingHolidays.length > 0) {
      console.log(
        `Holidays for the year ${year} already exist in the database.`
      );
      return res.json({
        msg: "exist",
        data: existingHolidays,
        info: `Holidays for the year ${year} already exist in the database.`,
      });
    }

    const allHolidays = await holidaysPH.getHolidays(year);
    console.log("All Holidays:");

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

      console.log("Insertion Result:", result);
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
