const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render("disciplinarylayout", { title: "Express" });
  Validator(req, res, "disciplinarylayout", "disciplinary");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = ` SELECT 
    me_profile_pic,
    oda_disciplinaryid,
    concat(me_firstname,' ',me_lastname) as oda_employeeid,
    mo_offensename as oda_offenseid,
    mda_description as oda_actionid,
    mv_description as oda_violation,
    oda_date,
    oda_createby,
    oda_createdate,
    oda_status
    from offense_disciplinary_actions
    LEFT JOIN master_employee ON offense_disciplinary_actions.oda_employeeid = me_id
    LEFT JOIN master_offense ON offense_disciplinary_actions.oda_offenseid = mo_offenseid
    LEFT JOIN master_disciplinary_action ON offense_disciplinary_actions.oda_actionid = mda_actionid
    LEFT JOIN master_violation ON offense_disciplinary_actions.oda_violation = mv_violationid`;

    mysql.Select(sql, "Offense_Disciplinary_Actions", (err, result) => {
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

router.post("/getactionoffense", (req, res) => {
  try {
    let description = req.body.description;
    let sql = `
    SELECT 
        mda.mda_actionid AS actionid,
        mda.mda_actioncode AS actioncode,
        mo.mo_offenseid AS offenseid,
        mo.mo_offensename AS offensename,
        mda.mda_description AS actiondescription,
        mv.mv_violationid AS violationid,
        mv.mv_description AS violationdescription
      FROM master_disciplinary_action mda
      RIGHT JOIN master_offense mo ON mo.mo_offenseid = mda.mda_offenseid
      RIGHT JOIN master_violation mv ON mda.mda_actionid = mv.mv_actionid
      WHERE mv.mv_description = '${description}'
    `;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        return res.json({
          msg: error,
        });
      });
  } catch (error) {
    console.error("Error: ", error);
    res.json({
      msg: "error",
      data: null,
    });
  }
});

router.post("/getactioncode", (req, res) => {
  try {
    let actioncode = req.body.actioncode;
    let index = actioncode[0];
    let sql = `
    SELECT 
    mda_actionid as actionid,
    mda_actioncode as actioncode,
    mda_description as description,
    mo_offensename as offencename,
    mo_offenseid as offenseid
    FROM master_disciplinary_action
    inner join master_offense on mda_offenseid = mo_offenseid
    where mda_actioncode like '${index}%'
    `;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        return res.json({
          msg: error,
        });
      });
  } catch (error) {
    console.error("Error: ", error);
    res.json({
      msg: "error",
      data: null,
    });
  }
});

router.post("/getoffensename", (req, res) => {
  try {
    let offensename = req.body.offensename;
    let sql = `SELECT 
    mda_actionid as actionid,
    mda_actioncode as actioncode,
    mda_description as description,
    mo_offensename as offencename,
    mo_offenseid as offenseid
    FROM master_disciplinary_action
    inner join master_offense on mda_offenseid = mo_offenseid
    where mo_offensename='${offensename}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        return res.json({
          msg: error,
        });
      });
  } catch (error) {
    console.error("Error: ", error);
    res.json({
      ms: "error",
      data: null,
    });
  }
});

router.post("/getoffenseaction", (req, res) => {
  try {
    let actioncode = req.body.actioncode;
    let offenceid = req.body.offenceid;
    let sql = `SELECT 
    mda_actioncode as actioncode,
    mda_description as description
    FROM master_disciplinary_action
    inner join master_offense on mda_offenseid = mo_offenseid
    where mda_actioncode like '${actioncode[0]}%'
    AND mo_offensename = '${offenceid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        return res.json({
          msg: error,
        });
      });
  } catch (error) {
    console.error("Error: ", error);
    res.json({
      ms: "error",
      data: null,
    });
  }
});

router.post("/save", async (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let offenseid = req.body.offenseid;
    let actionid = req.body.actionid;
    let violation = req.body.violation;
    let date = req.body.date;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD");
    let status = "Active";
    let data = [];

    const offenseIDquery = `select mo_offenseid from master_offense where mo_offensename ='${offenseid}'`;

    try {
      const offenseidresult = await mysql.mysqlQueryPromise(offenseIDquery);
      if (offenseidresult && offenseidresult.length > 0) {
        const offenseID = offenseidresult[0].mo_offenseid;

        const actionIDquery = `select mda_actionid from master_disciplinary_action where mda_actioncode = '${actionid}'`;

        try {
          const actionidresult = await mysql.mysqlQueryPromise(actionIDquery);
          if (actionidresult && actionidresult.length > 0) {
            const actionID = actionidresult[0].mda_actionid;

            const violationIDquery = `select mv_violationid from master_violation WHERE mv_description = '${violation}'`;

            try {
              const violationidresult = await mysql.mysqlQueryPromise(
                violationIDquery
              );
              if (violationidresult && violationidresult.length > 0) {
                const violationID = violationidresult[0].mv_violationid;

                data.push([
                  employeeid,
                  offenseID,
                  actionID,
                  violationID,
                  date,
                  createby,
                  createdate,
                  status,
                ]);

                mysql.InsertTable(
                  "offense_disciplinary_actions",
                  data,
                  (inserterr, insertresult) => {
                    if (inserterr) {
                      console.error("error inserting record: ", inserterr);
                      res.json({ msg: "insert failed" });
                    } else {
                      console.log(insertresult);
                      res.json({ msg: "success" });
                    }
                  }
                );
              } else {
                console.error("Action ID not found");
                res.json({ msg: "violation_id_not_found" });
              }
            } catch (violationerror) {
              console.error("error inserting: ", violationerror);
            }
          } else {
            console.error("Action ID not found");
            res.json({ msg: "action_id_not_found" });
          }
        } catch (actionerror) {
          console.error("error inserting: ", actionerror);
          res.json({ msg: "error" });
        }
      } else {
        console.error("Action ID not found");
        res.json({ msg: "offense_id_not_found" });
      }
    } catch (offenseerror) {
      console.error("error inserting record: ", offenseerror);
      res.json({ msg: "error" });
    }
  } catch (error) {
    console.log(error);
    console.error("Error: ", error);
    res.json({ msg: "error" });
  }
});

router.post("/getdisciplinary", (req, res) => {
  try {
    let disciplinaryid = req.body.disciplinaryid;
    let sql = `        
    select 
    me_profile_pic AS image,
    oda_disciplinaryid as disciplinaryid,
    oda_employeeid as employeeid,
    oda_offenseid as offenseid,
    oda_actionid as actionid,
    mv_violationid as violation,
    oda_date as date,
    oda_createby as createby,
    oda_createdate as createdate,
    oda_status as status
    from offense_disciplinary_actions
    inner join master_employee on offense_disciplinary_actions.oda_employeeid = me_id
    inner join master_violation on offense_disciplinary_actions.oda_violation = oda_violation
    where oda_disciplinaryid = '${disciplinaryid}'
    limit 1`;
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
          msg: "success",
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
