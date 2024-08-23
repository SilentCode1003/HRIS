const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { error } = require("jquery");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('shiftlayout', { title: 'Express' });
  Validator(req, res, "shiftsettingslayout", "shiftsettings");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT * FROM master_shift_settings
    WHERE mss_shiftstatus = 'Active'`;

    mysql.Select(sql, "Master_Shift_Settings", (err, result) => {
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
  console.log("HIT");
  try {
    let shiftname = req.body.shiftname;
    let startshift = req.body.startshift;
    let endshift = req.body.endshift;
    let restday = req.body.restday;
    let exemptedday = req.body.exemptedday;
    let createdate = currentDate.format("YYYY-MM-DD");
    let createby = req.session.fullname;
    let shiftstatus = "Active";
    let data = [];

    console.log(data, "data");

    data.push([
      shiftname,
      startshift,
      endshift,
      restday,
      exemptedday,
      createdate,
      createby,
      shiftstatus,
    ]);

    mysql.InsertTable("master_shift_settings", data, (err, result) => {
      if (err) console.error("Error: ", err);

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

router.post("/getshiftsettings", (req, res) => {
  try {
    let shiftsettingsid = req.body.shiftsettingsid;
    let sql = `select * from master_shift_settings
        where mss_shiftid = '${shiftsettingsid}'`;

    mysql.Select(sql, "Master_Shift_Settings", (err, result) => {
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
    let shiftsettingsid = req.body.shiftsettingsid;
    let shiftname = req.body.shiftname;
    let startshift = req.body.startshift;
    let endshift = req.body.endshift;
    let restday = req.body.restday;
    let exemptedday = req.body.exemptedday;
    let createdate = currentDate.format("YYYY-MM-DD");
    let createby = req.session.fullname;
    let shiftstatus = req.body.shiftstatus;
    let sql = `
        UPDATE master_shift_settings SET 
        mss_shiftname = '${shiftname}',
        mss_startshift = '${startshift}',
        mss_endshift = '${endshift}',
        mss_restday = '${restday}',
        mss_exemptedday = '${exemptedday}',
        mss_createdate = '${createdate}',
        mss_createby = '${createby}',
        mss_shiftstatus = '${shiftstatus}'
        WHERE mss_shiftid = '${shiftsettingsid}'`;

    mysql
      .Update(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          data: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});
