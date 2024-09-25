const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('approvedleavelayout', { title: 'Express' });
  Validator(req, res, "appsdetailslayout", "appsdetails");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT * FROM  apps_details`;

    mysql.Select(sql, "Apps_Details", (err, result) => {
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

router.post("/save", (req, res) => {
  try {
    let appimage = req.body.appimage;
    let appname = req.body.appname;
    let appsdetails = req.body.appsdetails;
    let appversion = req.body.appversion;
    let appdate = currentDate.format("YYYY-MM-DD");
    let appcreateby = req.session.fullname;
    let data = [];

    data.push([
      appimage,
      appname,
      appsdetails,
      appversion,
      appdate,
      appcreateby,
    ]);

    let sql = `SELECT * FROM apps_details WHERE ad_name = '${appname}'`;

    mysql.Select(sql, "Apps_Details", (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist",
        });
      } else {
        mysql.InsertTable("apps_details", data, (err, result) => {
          if (err) console.error("Error: ", err);

          res.json({
            msg: "success",
          });
        });
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.post("/getappsdetails", (req, res) => {
  try {
    let appid = req.body.appid;
    let sql = `select
    ad_image,
    ad_name,
    ad_details,
    ad_version 
    from apps_details 
    where ad_id = '${appid}'`;

    mysql.Select(sql, "Apps_Details", (err, result) => {
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

router.post("/update", (req, res) => {
  try {
    let appid = req.body.appid;
    let appimage = req.body.appimage;
    let appname = req.body.appname;
    let appsdetails = req.body.appsdetails;
    let appversion = req.body.appversion;
    let appdate = currentDate.format("YYYY-MM-DD");
    let appcreateby = req.session.fullname;

    let sql = `UPDATE apps_details SET 
    ad_image = '${appimage}',
    ad_name = '${appname}',
    ad_details = '${appsdetails}',
    ad_version = '${appversion}',
    ad_date = '${appdate}',
    ad_createby = '${appcreateby}'
    WHERE ad_id = '${appid}'`;

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
