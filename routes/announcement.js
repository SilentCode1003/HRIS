const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('announcementlayout', { title: 'Express' });

  Validator(req, res, "announcementlayout");
});

module.exports = router;

router.post("/getannouncement", (req, res) => {
  try {
    let bulletinid = req.body.bulletinid;
    let sql = `SELECT
      mb_image as image,
      mb_tittle as tittle,
      mb_description as description,
      mb_createby as createby,
      mb_status as status
      FROM master_bulletin
      WHERE mb_bulletinid = '${bulletinid}'`;

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

router.post("/save", (req, res) => {
  try {
    let image = req.body.image;
    let tittle = req.body.tittle;
    let description = req.body.description;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD");
    let status = req.body.status;

    let data = [];

    data.push([image, tittle, description, createby, createdate, status]);
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
    let bulletinid = req.body.bulletinid;
    let image = req.body.image;
    let tittle = req.body.tittle;
    let description = req.body.description;
    let createby = req.session.fullname;
    let status = req.body.status;

    let sqlupdate = `UPDATE master_bulletin SET   
      mb_description ='${description}', 
      mb_image ='${image}',
      mb_tittle = '${tittle}',
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

// router.post('/getnotif', (req,res) => {
//   try {
//     let employeeid = req.body.employeeid;

//     let sql = ``;
//     mysql.mysqlQueryPromise(sql)
//     .then((result) => {
//       res.json({
//         msg: 'success',
//         data: result,
//       });
//     })
//     .catch((error) => {
//       res.json({
//         msg: 'error',
//         data: error,
//       });
//     })
//   } catch (error) {
//     res.json({
//       msg: error,
//     });
//   }
// });

router.post('/getnotif', (req, res) => {
  try {
    let employeeid = req.body.employeeid;
    let sql = `call hrmis.GetNotification('${employeeid}')`;

    mysql.StoredProcedure(sql ,(err, result) => {
      if (err) console.log(err);
      console.log(result);
      res.json({
        msg: 'success',
        data: result,
      });
    });
    
  } catch (error) {
    res.json({
      msg: 'error',
      data: error,
    });
  }
});