const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const verifyJWT = require("../middleware/authenticator");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "accesslayout", "access");
});

module.exports = router;

router.post("/getaccess", (req, res) => {
  try {
    let accessid = req.body.accessid;
    let sql = ` select 
    ma_accessname as accessname,
    ma_status as status 
    from master_access
    where ma_accessid = '${accessid}'`;
    mysql
      .mysqlQueryPromise(sql)
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

router.get("/load", (req, res) => {
  try {
    let sql = "select * from master_access";

    mysql.Select(sql, "Master_Access", (err, result) => {
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


router.get("/loadlogin", (req, res) => {
  try {
    let sql = "select * from master_access where ma_status = 'Active'";

    mysql.Select(sql, "Master_Access", (err, result) => {
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


router.post("/save", (req, res) => {
  try {
    let accessname = req.body.accessname;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD");
    let status = "Active";

    let data = [[accessname, createby, createdate, status]];

    let query = `SELECT * FROM master_access WHERE ma_accessname = '${accessname}'`;

    mysql.Select(query, "Master_Access", (err, result) => {
      if (err) {
        console.error("Error: ", err);
        res.json({ msg: "error" });
        return;
      }

      if (result.length != 0) {
        res.json({ msg: "exist" });
        return;
      }

      mysql.InsertTable("master_access", data, (err, result) => {
        if (err) {
          console.error("Error: ", err);
          res.json({ msg: "error" });
          return;
        }

        res.json({ msg: "success" });
      });
    });
  } catch (error) {
    console.error("Error: ", error);
    res.json({ msg: "error" });
  }
});

router.post("/update", (req, res) => {
  try {
    let accessid = req.body.accessid;
    let accessname = req.body.accessname;
    let createby = req.session.fullname;
    let status = req.body.status;

    let sqlupdate = `UPDATE master_access SET 
      ma_accessname ='${accessname}', 
      ma_createby ='${createby}',
      ma_status ='${status}' 
      WHERE ma_accessid ='${accessid}'`;

    mysql
      .Update(sqlupdate)
      .then((result) => {
        res.json({
          msg: "success",
        });
      })
      .catch((error) => {
        res.json({
          msg: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
    });
  }
});
