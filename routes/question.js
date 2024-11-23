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
  Validator(req, res, "questionlayout", "question");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `
          SELECT
         mq_questionid,
         me_examname as mq_examname,
         qt_typename as mq_question_type,
         mq_question_answer,
         qt_type_points as mq_points,
         mq_createdate,
         mq_createby
         FROM master_question
         INNER JOIN master_exam ON master_question.mq_examid = me_examid
         INNER JOIN question_type ON master_question.mq_question_typeid = qt_typeid`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mq_");
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
    const {
      examname,
      questiontext,
      questiontype,
      questionchoices,
      questionanswer,
      questionimage,
    } = req.body;

    const choicesJson = JSON.stringify(questionchoices);

    let sql = InsertStatement("master_question", "mq", [
      "examid",
      "question_text",
      "question_typeid",
      "question_choices",
      "question_answer",
      "createdate",
      "createby",
      "question_image",
    ]);

    let data = [
      [
        examname,
        questiontext,
        questiontype,
        choicesJson,
        questionanswer,
        createddate,
        createdby,
        questionimage,
      ],
    ];

    let checkStatement = SelectStatement(
      "select * from master_question where mq_examid=? and mq_question_text=?",
      [examname, questiontext]
    );

    Check(checkStatement)
      .then((result) => {
        if (result.length !== 0) {
          return res.json(JsonWarningResponse(MessageStatus.EXIST));
        } else {
          InsertTable(sql, data, (err, result) => {
            if (err) {
              console.log(err);
              return res.json(JsonErrorResponse(err));
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
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/getquestion", (req, res) => {
  try {
    let questionid = req.body.questionid;
    let sql = `SELECT 
    mq_questionid,
    mq_examid,
    me_duration as mq_duration,
    mq_question_text,
    mq_question_typeid,
    mq_question_choices,
    mq_question_answer,
    mq_question_image
    FROM master_question
    INNER JOIN master_exam ON master_question.mq_examid = me_examid
    INNER JOIN question_type ON master_question.mq_question_typeid = qt_typeid
    WHERE mq_questionid = '${questionid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "mq_");
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
    const {
      questionid,
      examname,
      questiontext,
      questiontype,
      questionchoices,
      questionanswer,
      questionimage,
      createdby,
      createddate,
    } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (examname) {
      data.push(examname);
      columns.push("examid");
    }

    if (questiontext) {
      data.push(questiontext);
      columns.push("question_text");
    }

    if (questiontype) {
      data.push(questiontype);
      columns.push("question_typeid");
    }

    if (questionchoices) {
      data.push(questionchoices);
      columns.push("question_choices");
    }

    if (questionanswer) {
      data.push(questionanswer);
      columns.push("question_answer");
    }

    if (questionimage) {
      data.push(questionimage);
      columns.push("question_image");
    }

    if (createdby) {
      data.push(createdby);
      columns.push("createby");
    }

    if (createddate) {
      data.push(createddate);
      columns.push("createdate");
    }

    if (questionid) {
      data.push(questionid);
      arguments.push("questionid");
    }

    let updateStatement = UpdateStatement(
      "master_question",
      "mq",
      columns,
      arguments
    );

    let checkStatement = SelectStatement(
      "select * from master_question where mq_examid=? and mq_question_text=? and mq_question_typeid=? and mq_question_choices=? and mq_question_answer=? and mq_question_image=?",
      [
        examname,
        questiontext,
        questiontype,
        questionchoices,
        questionanswer,
        questionimage,
      ]
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
