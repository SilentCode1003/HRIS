const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(req, res, "subgrouplayout");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    s_id,
    md_departmentname as s_departmentid,
    s_name,
    s_createby,
    s_createdate,
    s_status
    FROM subgroup
    INNER JOIN master_department on 
    subgroup.s_departmentid = md_departmentid`;

    mysql.Select(sql, "Subgroup", (err, result) => {
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
    let departmentid = req.body.departmentid;
    let subgroupname = req.body.subgroupname;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    let status = "Active";
    let data = [];

    data.push([departmentid, subgroupname, createby, createdate, status]);

    let sql = `SELECT * FROM subgroup WHERE 
    s_departmentid = '${departmentid}' AND s_name = '${subgroupname}'`;

    mysql.Select(sql, "Subgroup", (err, result) => {
      if (err) console.error("Error :", err);

      if (result.length != 0) {
        res.json({
          msg: "exist",
        });
      } else {
        mysql.InsertTable("subgroup", data, (err, result) => {
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

router.post("/getsubgroup", (req, res) => {
  try {
    let subgroupid = req.body.subgroupid;
    let sql = ` SELECT
    s_id,
    s_departmentid,
    s_name,
    s_createby,
    s_createdate,
    s_status
    FROM subgroup
    WHERE s_id = '${subgroupid}'`;

    mysql.Select(sql, "Subgroup", (err, result) => {
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
    let subgroupid = req.body.subgroupid;
    let departmentid = req.body.departmentid;
    let subgroupname = req.body.subgroupname;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD HH:mm:ss");
    let status = req.body.status;

    let sql = `  UPDATE subgroup SET 
    s_departmentid = '${departmentid}',
    s_name = '${subgroupname}',
    s_createby = '${createby}',
    s_createdate = '${createdate}',
    s_status = '${status}'
    WHERE s_id = '${subgroupid}'`;
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
    console.log(error);
  }
});
