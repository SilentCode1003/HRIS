const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('interestlayout', { title: 'Express' });
  Validator(req, res, "leavesettingslayout");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT * FROM master_leave`;

    mysql.Select(sql, "Master_Leaves", (err, result) => {
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

router.post("/setleave", (req, res) => {
    try {
      let totalleave = req.body.totalleave;
      let yearleave = req.body.yearleave;
      let leavetype = req.body.leavetype;

      console.log(yearleave);
      console.log(leavetype);
  
      let checkSql = `SELECT COUNT(*) AS count FROM master_leaves WHERE ml_year = '${yearleave}' AND ml_leavetype = '${leavetype}'`;
  
      mysql.Select(checkSql, "Master_Leaves", (err, result) => {
        if (err) console.error('Error: ', err);


        if (result.length != 1) {
          res.json({
            msg: "exist"
          });
        } else {
          let sql = `CALL hrmis.CreateLeave(${totalleave}, ${yearleave}, '${leavetype}')`;
  
          mysql.StoredProcedure(sql, (err, result) => {
            if (err) {
              console.error("Error calling stored procedure: ", err);
              res.json({
                msg: "error",
                data: err,
              });
            } else {
              //console.log(result);
              res.json({
                msg: "success",
                data: result,
              });
            }
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
  
