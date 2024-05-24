const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('positionlayout', { title: 'Express' });
  Validator(req, res, "positionlayout", "position");
});

module.exports = router;

router.post("/getposition", (req, res) => {
  try {
    let positionid = req.body.positionid;
    let sql = `SELECT
      mp_positionname as positionname,
      mp_createdby as createdby,
      mp_status as status
      FROM master_position
      WHERE mp_positionid = '${positionid}'`;

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
    let sql = "select * from master_position";

    mysql.Select(sql, "Master_Position", (err, result) => {
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
    let positionname = req.body.positionname;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD");
    let status = "Active";

    let data = [];

    data.push([positionname, createby, createdate, status]);
    let query = `SELECT * FROM master_position WHERE mp_positionname = '${positionname}'`;
    mysql.Select(query, "Master_Position", (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist",
        });
      } else {
        mysql.InsertTable("master_position", data, (err, result) => {
          if (err) console.error("Error: ", err);

          console.log(result);

          res.json({
            msg: "success",
          });
        });
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
    });
  }
});

router.post("/update", (req, res) => {
  try {
    let positionid = req.body.positionid;
    let positionname = req.body.positionname;
    let createby = req.session.fullname;
    let status = req.body.status;

    let sqlupdate = `UPDATE master_position SET   
    mp_positionname ='${positionname}', 
    mp_createdby ='${createby}', 
    mp_status ='${status}' 
    WHERE mp_positionid ='${positionid}'`;

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

    // mysql.Update(sqlupdate, (err,result) =>{
    //   if(err) console.error('Error: ', err);

    //   console.log(result);

    //   res.json({
    //     msg: 'success'
    //   })
    // })
  } catch (error) {
    res.json({
      msg: "error",
    });
  }
});
