const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const { InsertStatement, GetCurrentDatetime, SelectStatement, UpdateStatement } = require("./repository/customhelper");
const { InsertTable, Select, Update } = require("./repository/dbconnect");
const { JsonSuccess, JsonErrorResponse, JsonWarningResponse, MessageStatus, JsonDataResponse } = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
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
    mb_enddate as enddate,
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
    let sql = `SELECT
    mb_bulletinid,
    mb_tittle,
    mb_type,
    mb_targetdate,
    mb_enddate,
    mb_createby,
    mb_createdate,
    mb_status
    FROM master_bulletin`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mb_");

        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.post("/save", (req, res) => {
  console.log("SAVE");
  try {
    let image = req.body.image;
    let tittle = req.body.tittle;
    let type = req.body.type;
    let targetdate = req.body.targetdate;
    let enddate = req.body.enddate;
    let description = req.body.description;
    let createby = req.session.fullname;
    let createdate = GetCurrentDatetime();
    let status = "Active";

    console.log(image);
    console.log(req.body,'body');
    
    

    let sql = InsertStatement("master_bulletin", "mb", [
      "image",
      "tittle",
      "type",
      "targetdate",
      "enddate",
      "description",
      "createby",
      "createdate",
      "status",
    ]);

    console.log(sql);
    

    let data = [
      [
        image,
        tittle,
        type,
        targetdate,
        enddate,
        description,
        createby,
        createdate,
        status,
      ],
    ];

    console.log(data);
    
    let checkStatement = SelectStatement(
      "select * from master_bulletin where mb_tittle=? and mb_type=? and mb_targetdate=? and mb_status",
      [tittle, type, targetdate, status]
    );

    Check(checkStatement)
      .then((result) => {
        console.log(result);
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              console.log(err);
              res.json(JsonErrorResponse(err));
            }

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(err);
    res.json(JsonErrorResponse(error));
  }
});

// router.post("/update", (req, res) => {
//   try {
//     let bulletinid = req.body.bulletinid;
//     let image = req.body.image;
//     let tittle = req.body.tittle;
//     let type = req.body.type;
//     let targetdate = req.body.targetdate;
//     let description = req.body.description;
//     let createby = req.session.fullname;
//     let status = req.body.status;

//     let sqlupdate = `UPDATE master_bulletin SET   
//     mb_description ='${description}', 
//     mb_image ='${image}',
//     mb_tittle = '${tittle}',
//     mb_type = '${type}',
//     mb_targetdate = '${targetdate}',
//     mb_createby ='${createby}', 
//     mb_status ='${status}'
//     WHERE mb_bulletinid ='${bulletinid}'`;

//     mysql
//       .Update(sqlupdate)
//       .then((result) => {
//         res.json({
//           msg: "success",
//         });
//       })
//       .catch((error) => {
//         res.json({
//           msg: error,
//         });
//       });
//   } catch (error) {
//     res.json({
//       msg: "error",
//     });
//   }
// });


router.put("/edit", (req, res) => {
  try {
    let bulletinid = req.body.bulletinid;
    let image = req.body.image;
    let tittle = req.body.tittle;
    let type = req.body.type;
    let targetdate = req.body.targetdate;
    let enddate = req.body.enddate;
    let description = req.body.description;
    let createby = req.session.fullname;
    let status = req.body.status;

    let data = [];
    let columns = [];
    let arguments = [];

    if (image) {
      data.push(image);
      columns.push("image");
    }

    if (tittle) {
      data.push(tittle);
      columns.push("tittle");
    }

    if (targetdate) {
      data.push(targetdate);
      columns.push("targetdate");
    }

    if (enddate) {
      data.push(enddate);
      columns.push("enddate");
    }


    if (type) {
      data.push(type);
      columns.push("type");
    }

    if (description) {
      data.push(description);
      columns.push("description");
    }

    if (createby) {
      data.push(createby);
      columns.push("createby");
    }


    if (status) {
      data.push(status);
      columns.push("status");
    }

    if (bulletinid) {
      data.push(bulletinid);
      arguments.push("bulletinid");
    }

    let updateStatement = UpdateStatement(
      "master_bulletin",
      "mb",
      columns,
      arguments
    );

    console.log(updateStatement);

    let checkStatement = SelectStatement(
      "select * from master_bulletin where mb_bulletinid = ? and mb_tittle = ? and mb_type = ? and mb_status = ? and mb_image = ? and mb_description = ? and mb_enddate = ? and mb_targetdate = ?",
      [bulletinid, tittle, type, status, image, description, enddate, targetdate]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);

            console.log(result);

            res.json(JsonSuccess());
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.json(JsonErrorResponse(error));
      });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
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


//#region FUNCTION
function Check(sql) {
  return new Promise((resolve, reject) => {
    Select(sql, (err, result) => {
      if (err) reject(err);

      resolve(result);
    });
  });
}
//#endregion