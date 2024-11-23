const { Validator } = require("./controller/middleware");
const mysql = require("./repository/hrmisdb");
var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('trainingslayout', { title: 'Express' });
  Validator(req, res, "trainingslayout", "trainings");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = ` SELECT 
    mt_trainingid,
    mt_name,
    me_id, concat(me_firstname, ' ', me_lastname) AS mt_employeeid,
    mt_startdate,
    mt_enddate,
    mt_location,
    mt_status
   FROM master_training
    LEFT JOIN master_employee ON master_training.mt_employeeid = me_id`;

    mysql.Select(sql, "Master_Training", (err, result) => {
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
    let name = req.body.name;
    let employeeid = req.body.employeeid;
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let location = req.body.location;
    let status = "Active";
    let data = [];

    const employeename = `SELECT * FROM master_training WHERE mt_employeeid = '${employeeid}' AND mt_name = '${name}'`;
    const checkParams = [employeeid, name];

    const employeenameresult = await mysql.mysqlQueryPromise(
      employeename,
      checkParams
    );

    if (employeenameresult.length > 0) {
      res.json({
        msg: "exist",
      });
      return;
    }

    data.push([name, employeeid, startdate, enddate, location, status]);

    mysql.InsertTable("master_training", data, (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Error inserting record: ", insertErr);
        res.json({ msg: "insert_failed" });
      } else {
        res.json({ msg: "success" });
      }
    });
  } catch (error) {
    console.log("Error: ", error);
    res.json({ msg: "error" });
  }
});

router.post("/update", (req, res) => {
  try {
    let trainingid = req.body.trainingid;
    let name = req.body.name;
    let employeeid = req.body.employeeid;
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let location = req.body.location;
    let status = req.body.status;

    let sqlupdate = `UPDATE master_training SET   
    mt_name ='${name}', 
    mt_employeeid ='${employeeid}',
    mt_startdate ='${startdate}',
    mt_enddate ='${enddate}', 
    mt_location ='${location}', 
    mt_status ='${status}'
    WHERE mt_trainingid ='${trainingid}'`;

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

router.post("/gettraining", (req, res) => {
  try {
    let trainingid = req.body.trainingid;
    let sql = `SELECT
      mt_name as name,
      mt_employeeid as employeeid,
      mt_startdate as startdate,
      mt_enddate as enddate,
      mt_location as location,
      mt_status as status
      FROM master_training
      WHERE mt_trainingid = '${trainingid}'`;

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
