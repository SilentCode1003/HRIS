var express = require("express");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonWarningResponse,
  JsonSuccess,
  MessageStatus,
} = require("./repository/response");
const { Select, Update, InsertTable } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { GetValue, ACT, INACT } = require("./repository/dictionary");
const {
  GetCurrentDatetime,
  SelectStatement,
  InsertStatement,
  UpdateStatement,
} = require("./repository/customhelper");
const { Validator } = require("./controller/middleware");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('govermentidlayout', { title: 'Express' });
  Validator(req, res, "question_typelayout", "question_type");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `
        SELECT
         qt_typeid,
         qt_typename,
         qt_type_points,
         qt_createby,
         qt_createdate
         FROM question_type`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "qt_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.post("/save", (req, res) => {
  try {
    let createdby = req.session.fullname;
    let createddate = GetCurrentDatetime();
    const { questiontypename, questiontypepoints } = req.body;

    let sql = InsertStatement("question_type", "qt", [
      "typename",
      "type_points",
      "createby",
      "createdate",
    ]);
    let data = [[questiontypename, questiontypepoints, createdby, createddate]];
    let checkStatement = SelectStatement(
      "select * from question_type where qt_typename=? and qt_type_points=?",
      [questiontypename, questiontypepoints]
    );

    Check(checkStatement)
      .then((result) => {
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

router.post("/getquestiontype", (req, res) => {
  try {
    let question_typeid = req.body.questiontypeid;
    let sql = `
          SELECT
           qt_typeid,
           qt_typename,
           qt_type_points,
           qt_createby,
           qt_createdate
           FROM question_type
          WHERE qt_typeid = '${question_typeid}';`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "qt_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.put("/edit", (req, res) => {
  try {
    let createby = req.session.fullname;
    let createdate = GetCurrentDatetime();
    const { questiontypeid, typename, type_points } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (typename) {
      data.push(typename);
      columns.push("typename");
    }

    if (type_points) {
      data.push(type_points);
      columns.push("type_points");
    }

    if (createby) {
      data.push(createby);
      columns.push("createby");
    }

    if (createdate) {
      data.push(createdate);
      columns.push("createdate");
    }

    if (questiontypeid) {
      data.push(questiontypeid);
      arguments.push("typeid");
    }

    let updateStatement = UpdateStatement(
      "question_type",
      "qt",
      columns,
      arguments
    );

    let checkStatement = SelectStatement(
      "select * from question_type where qt_typename = ? and qt_type_points = ?",
      [typename, type_points]
    );

    Check(checkStatement)
      .then((result) => {
        if (result != 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          Update(updateStatement, data, (err, result) => {
            if (err) console.error("Error: ", err);

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
