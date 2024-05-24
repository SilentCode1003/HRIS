const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('violationlayout', { title: 'Express' });
  Validator(req, res, "violationlayout", "violation");
});

module.exports = router;

router.post("/getviolation", (req, res) => {
  try {
    let violationid = req.body.violationid;
    let sql = `SELECT
      mv_description as description,
      mv_actionid as actionid,
      mv_createby as createby,
      mv_status as status
      FROM master_violation
      WHERE mv_violationid = '${violationid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: result,
          });
        } else {
          res.status(404).json({
            msg: "Department not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching department data",
          error: error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Internal server error",
      error: error,
    });
  }
});

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    mv_violationid,
    mv_description,
    mda_actioncode as mv_actionid,
    mv_createby,
    mv_createdate,
    mv_status
    from master_violation
    LEFT JOIN master_disciplinary_action ON master_violation.mv_actionid = mda_actionid`;

    mysql.Select(sql, "Master_Violation", (err, result) => {
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

router.post("/save", async (req, res) => {
  try {
    let description = req.body.description;
    let actionid = req.body.actionid;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD");
    let status = "Active";

    const actionIdQuery = `SELECT mda_actionid FROM master_disciplinary_action WHERE mda_actioncode = '${actionid}'`;

    const actionIdResult = await mysql.mysqlQueryPromise(actionIdQuery, [
      actionid,
    ]);

    if (actionIdResult.length > 0) {
      const actioncode = actionIdResult[0].mda_actionid;

      const data = [[description, actioncode, createby, createdate, status]];

      mysql.InsertTable("master_violation", data, (insertErr, insertResult) => {
        if (insertErr) {
          console.error("Error inserting record: ", insertErr);
          res.json({ msg: "insert_failed" });
        } else {
          console.log(insertResult);
          res.json({ msg: "success" });
        }
      });
    } else {
      res.json({ msg: "department_not_found" });
    }
  } catch (error) {
    console.error("Error: ", error);
    res.json({ msg: "error" });
  }
});

router.post("/update", (req, res) => {
  try {
    let violationid = req.body.violationid;
    let description = req.body.description;
    let actionid = req.body.actionid;
    let createby = req.session.fullname;
    let status = req.body.status;

    let sqlupdate = `UPDATE master_violation SET   
    mv_description ='${description}', 
    mv_actionid ='${actionid}', 
    mv_createby ='${createby}',
    mv_status = '${status}'
    WHERE mv_violationid ='${violationid}'`;

    mysql
      .Update(sqlupdate)
      .then((result) => {
        console.log(result);

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
