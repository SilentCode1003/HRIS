const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('disciplinaryactionlayout', { title: 'Express' });

  Validator(req, res, "disciplinaryactionlayout", "disciplinaryaction");
});

module.exports = router;

router.post("/getdisciplinaryaction", (req, res) => {
  try {
    let disciplinaryactionid = req.body.disciplinaryactionid;
    let sql = `SELECT
      mda_actioncode as actioncode,
      mda_offenseid as offenseid,
      mda_description as description,
      mda_createby as createby,
      mda_status as status
      FROM master_disciplinary_action
      WHERE mda_actionid = '${disciplinaryactionid}'`;

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
    mda_actionid,
    mda_actioncode,
    mo_offensename as mda_offenseid,
    mda_description,
    mda_createdate,
    mda_createby,
    mda_status
    from master_disciplinary_action
    LEFT JOIN master_offense ON master_disciplinary_action.mda_offenseid = mo_offenseid`;

    mysql.Select(sql, "Master_Disciplinary_Action", (err, result) => {
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
    let actioncode = req.body.actioncode;
    let offenseid = req.body.offenseid;
    let description = req.body.description;
    let createdate = currentDate.format("YYYY-MM-DD");
    let createby = req.session.fullname;
    let status = "Active";
    console.log("Received department name:", offenseid);

    let offenseIdQuery = `SELECT mo_offenseid FROM master_offense WHERE mo_offensename = '${offenseid}'`;

    const offenseIdResult = await mysql.mysqlQueryPromise(offenseIdQuery, [
      offenseid,
    ]);

    if (offenseIdResult.length > 0) {
      const offenseID = offenseIdResult[0].mo_offenseid;

      const data = [
        [actioncode, offenseID, description, createdate, createby, status],
      ];

      mysql.InsertTable(
        "master_disciplinary_action",
        data,
        (insertErr, insertResult) => {
          if (insertErr) {
            console.error("Error inserting record: ", insertErr);
            res.json({ msg: "insert_failed" });
          } else {
            console.log(insertResult);
            res.json({ msg: "success" });
          }
        }
      );
    } else {
      res.json({ msg: "offense_not_found" });
    }
  } catch (error) {
    console.log(error);
    console.error("Error: ", error);
    res.json({ msg: "error" });
  }
});

router.post("/update", (req, res) => {
  try {
    let disciplinaryactionid = req.body.disciplinaryactionid;
    let actioncode = req.body.actioncode;
    let offenseid = req.body.offenseid;
    let description = req.body.description;
    let createby = req.session.fullname;
    let status = req.body.status;

    let sqlupdate = `UPDATE master_disciplinary_action SET   
    mda_actioncode ='${actioncode}', 
    mda_offenseid ='${offenseid}', 
    mda_description ='${description}',
    mda_createby ='${createby}', 
    mda_status ='${status}'
    WHERE mda_actionid ='${disciplinaryactionid}'`;

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
