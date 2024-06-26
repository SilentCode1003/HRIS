const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "announcementlayout", "announcement");
});

module.exports = router;

router.post("/getannouncement", (req, res) => {
  try {
    let bulletinid = req.body.bulletinid;
    let sql = `SELECT
    mb_image as image,
    mb_tittle as tittle,
    mb_type as type,
    mb_description as description,
    mb_targetdate as targetdate,
    mb_createby as createby,
    mb_status as status
    FROM master_bulletin
    WHERE mb_bulletinid = '${bulletinid}'`;

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
    let sql = "select * from master_bulletin";

    mysql.Select(sql, "Master_Bulletin", (err, result) => {
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

router.post("/loadforapp", (req, res) => {
  try {
    let sql = `select * from master_bulletin
    order by mb_bulletinid desc`;

    mysql.Select(sql, "Master_Bulletin", (err, result) => {
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
    let image = req.body.image;
    let tittle = req.body.tittle;
    let type = req.body.type;
    let targetdate = req.body.targetdate;
    let description = req.body.description;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD");
    let status = "Active";

    let data = [];

    data.push([
      image,
      tittle,
      type,
      targetdate,
      description,
      createby,
      createdate,
      status,
    ]);
    let query = `SELECT * FROM master_bulletin WHERE mb_description = '${description}'`;
    mysql.Select(query, "Master_Bulletin", (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist",
        });
      } else {
        mysql.InsertTable("master_bulletin", data, (err, result) => {
          if (err) console.error("Error: ", err);

          console.log(result);

          res.status(200).json({
            msg: "success",
            data: data,
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
    let bulletinid = req.body.bulletinid;
    let image = req.body.image;
    let tittle = req.body.tittle;
    let type = req.body.type;
    let targetdate = req.body.targetdate;
    let description = req.body.description;
    let createby = req.session.fullname;
    let status = req.body.status;

    let sqlupdate = `UPDATE master_bulletin SET   
    mb_description ='${description}', 
    mb_image ='${image}',
    mb_tittle = '${tittle}',
    mb_type = '${type}',
    mb_targetdate = '${targetdate}',
    mb_createby ='${createby}', 
    mb_status ='${status}'
    WHERE mb_bulletinid ='${bulletinid}'`;

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

router.post("/loadannouncements", (req, res) => {
  try {
    let sql = `SELECT 
    mb_image,
    mb_tittle,
    mb_description,
    mb_targetdate,
    mb_type,
    mb_status
    FROM master_bulletin
    WHERE mb_status = 'Active' 
    AND (mb_type = 'Announcement' OR (mb_type = 'Event' AND mb_targetdate >= CURDATE()))`;

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

router.post("/getnotif", (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `call hrmis.GetNotification('${employeeid}')`;

    mysql.StoredProcedure(sql, (err, result) => {
      if (err) console.log(err);
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
