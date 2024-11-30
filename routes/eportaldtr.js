var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  SelectStatement,
  GetCurrentYear,
  GenerateDates,
  InsertStatement,
  UpdateStatement,
} = require("./repository/customhelper");
const { Select, Insert, Update } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('eportaldtrlayout', { title: 'Express' });
  Validator(req, res, "eportaldtrlayout", "eportaldtr");
});

module.exports = router;

router.get("/load/:cutoffdate", async (req, res, next) => {
  try {
    const { cutoffdate } = req.params;
    let sql = SelectStatement(
      "select * from daily_time_record where dtr_cut_off = ? and dtr_employeeid = ?",
      [cutoffdate, req.session.employeeid]
    );

    Select(sql, (err, result) => {
      if (err) {
        res.status(500).send(err);
      }

      if (result.length != 0) {
        let data = DataModeling(result, "dtr_");

        return res.status(200).json({
          msg: "success",
          data: data,
        });
      }
      res.status(200).json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/payrolla-ttendance-date", (req, res) => {
  try {
    const { payrollid } = req.body;

    let sql = SelectStatement(
      "select * from payroll_date where pd_payrollid = ?",
      [payrollid]
    );

    Select(sql, async (err, result) => {
      if (err) {
        return res.status(500).send(err);
      }

      if (result.length != 0) {
        let data = DataModeling(result, "pd_");

        const dates = GenerateDates(data[0].startdate, data[0].enddate);
        const payrolldate = data[0].payrolldate.toISOString().split("T")[0];
        const exist = await CheckExist([payrolldate, req.session.employeeid]);

        if (exist) {
          return res.status(200).json({
            msg: "success",
            data: payrolldate,
          });
        } else {
          dates.forEach((date) => {
            let dtr_insert = InsertStatement("daily_time_record", "dtr", [
              "cut_off",
              "attendance_date",
              "employeeid",
            ]);
            let dtr_data = [];
            dtr_data.push([payrolldate, date, req.session.employeeid]);

            Insert(dtr_insert, dtr_data, (err, result) => {
              if (err) {
                console.log(err);

                return res.status(500).send(err);
              }
            });
          });

          return res.status(200).json({
            msg: "success",
            data: payrolldate,
          });
        }
      }
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/getpayrolldate", (req, res) => {
  try {
    let sql = SelectStatement(
      "select * from payroll_date where pd_payrolldate like ?",
      [`${GetCurrentYear()}%`]
    );

    Select(sql, (err, result) => {
      if (err) {
        res.status(500).send(err);
      }

      // console.log(result);

      if (result.length != 0) {
        let data = DataModeling(result, "pd_");

        return res.status(200).json({
          msg: "success",
          data: data,
        });
      }
      res.status(200).json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.put("/edit-dtr", (req, res) => {
  try {
    const { employeeid, attendancedate, ticket, service, remark } = req.body;
    let update_sql = UpdateStatement(
      "daily_time_record",
      "dtr",
      ["ticket_number", "service", "remarks"],
      ["attendance_date", "employeeid"]
    );
    let data = [ticket, service, remark, attendancedate, employeeid];

    Update(update_sql, data, (err, result) => {
      if (err) {
        console.log(err.sqlMessage);
        return res.status(500).send(err);
      }

      if (result.length != 0) {
        return res.status(200).json({
          msg: "success",
          data: result,
        });
      }
      res.status(200).json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/getdtr/:attendancedate/:employeeid", (req, res) => {
  try {
    const { attendancedate, employeeid } = req.params;
    let sql = SelectStatement(
      "select * from daily_time_record where dtr_attendance_date = ? and dtr_employeeid = ?",
      [attendancedate, employeeid]
    );

    Select(sql, (err, result) => {
      if (err) {
        res.status(500).send(err);
      }

      if (result.length != 0) {
        let data = DataModeling(result, "dtr_");

        console.log(data);
        

        return res.status(200).json({
          msg: "success",
          data: data,
        });
      }
      res.status(200).json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

async function CheckExist(data) {
  return new Promise((resolve, reject) => {
    let sql = SelectStatement(
      "select * from daily_time_record where dtr_cut_off = ? and dtr_employeeid = ?",
      data
    );

    Select(sql, (err, result) => {
      if (err) {
        return reject(err);
      }
      // console.log(result);

      if (result.length != 0) {
        return resolve(true);
      } else {
        return resolve(false);
      }
    });
  });
}
