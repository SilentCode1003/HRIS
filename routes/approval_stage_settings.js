const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(
    req,
    res,
    "approval_stage_settingslayout",
    "approval_stage_settings"
  );
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT
      ats_id,
      ma_accessname as ats_accessid,
      ats_count,
      ats_createdby,
      ats_createddate
      FROM aprroval_stage_settings
      INNER JOIN master_access on aprroval_stage_settings.ats_accessid = ma_accessid`;

    mysql.Select(sql, "Approval_Stage_Settings", (err, result) => {
      if (err) console.error("Error Fetching Data: ", err);

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
    let accessid = req.body.accessid;
    let approvalcount = req.body.approvalcount;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    let data = [];

    data.push([accessid, approvalcount, createby, createdate]);

    let sql = `SELECT * FROM aprroval_stage_settings WHERE 
    ats_accessid = '${accessid}' AND ats_count = '${approvalcount}'`;

    mysql.Select(sql, "Approval_Stage_Settings", (err, result) => {
      if (err) console.error("Error :", err);

      if (result.length != 0) {
        res.json({
          msg: "exist",
        });
      } else {
        mysql.InsertTable("aprroval_stage_settings", data, (err, result) => {
          if (err) console.error("Error: ", err);

          console.log(result);
          res.json({
            msg: "success",
            data: result,
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

router.post("/getstagesettings", (req, res) => {
  try {
    let approvalstage = req.body.approvalstage;
    let sql = `SELECT
    ats_id,
    ats_accessid,
    ats_count,
    ats_createdby,
    ats_createddate
    FROM aprroval_stage_settings
    INNER JOIN master_access ON aprroval_stage_settings.ats_accessid = ma_accessid
    WHERE  ats_id = '${approvalstage}'`;

    mysql.Select(sql, "Approval_Stage_Settings", (err, result) => {
      if (err) console.error("Error :", err);

      console.log(result);
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
    let approvalstage = req.body.approvalstage;
    let accessid = req.body.accessid;
    let approvalcount = req.body.approvalcount;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");

    console.log(approvalstage, approvalcount);

    let checkexist = `SELECT * FROM aprroval_stage_settings 
    WHERE ats_accessid = '${accessid}' AND ats_count = '${approvalcount}'`;

    console.log(checkexist, "sql");

    mysql.Select(checkexist, "Approval_Stage_Settings", (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist",
        });
      } else {
        let sql = `UPDATE aprroval_stage_settings SET 
    ats_accessid = '${accessid}',
    ats_count = '${approvalcount}',
    ats_createdby = '${createby}',
    ats_createddate = '${createdate}'
    WHERE ats_id = '${approvalstage}'`;

        console.log(sql, "sql");

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
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
    console.log(error);
  }
});
