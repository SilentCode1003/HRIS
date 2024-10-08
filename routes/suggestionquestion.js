var express = require("express");
var router = express.Router();
const { Validator } = require("./controller/middleware");
const {
  SelectStatement,
  GetCurrentDate,
  InsertStatement,
  UpdateStatement,
} = require("./repository/customhelper");
const { Select, Insert, Update } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { STATUS_LOG } = require("./repository/enums");


router.get("/", function (req, res, next) {
    Validator(req, res, "suggestionquestionlayout", "suggestionquestion");
  });

  module.exports = router;

  
router.get("/load", function (req, res) {
    try {
      let sql = SelectStatement("select * from suggestion_question", []);
  
      Select(sql, (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).json({ msg: "error" });
        }
        if (result.length != 0) {
          let data = DataModeling(result, "sq_");
          res.json({ msg: "success", data: data });
        } else {
          res.json({ msg: "success", data: result });
        }
      });
    } catch (error) {
      res.status(500).json({ msg: "error" });
    }
  });
  
  router.post("/save", function (req, res) {
    try {
      const { question } = req.body;
      let status = STATUS_LOG.ACTIVE;
      let createddate = GetCurrentDate();
      let createdby = req.session.fullname;
      let data = [[question, status, createddate, createdby]];
  
      let cmd = InsertStatement("suggestion_question", "sq", [
        "question",
        "status",
        "createddate",
        "createdby",
      ]);
  
      let sql_check = SelectStatement(
        "select * from suggestion_question where sq_question = ?",
        [question]
      );
  
      console.log(sql_check);
      console.log(cmd);
      
      
      Select(sql_check, (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ msg: "error" });
        }
  
        console.log(result);
        
  
        if (result.length != 0) {
          return res.json({ msg: "exist" });
        }
  
        Insert(cmd, data, (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ msg: "error" });
          }
          res.json({ msg: "success" });
        });
      });
    } catch (error) {
      res.status(500).json({ msg: "error" });
    }
  });
  
  router.patch("/status", function (req, res) {
      try {
          const { id, status } = req.body;
          let status_new = status == STATUS_LOG.ACTIVE ? STATUS_LOG.INACTIVE : STATUS_LOG.ACTIVE;
          
          let cmd = UpdateStatement("suggestion_question", "sq", ["status"], ["id"]);
          let data = [status_new, id];
          
          Update(cmd, data, (err, result) => {
              if (err) {
                  console.log(err);
              }
              
              console.log(result);
          });
          
          res.status(200).json({ msg: "success" });
          
      } catch (error) {
          res.status(500).json({ msg: "error" });
      }
  });
  
  
  router.patch("/update", function (req, res) {
      try {
          const { id, question } = req.body;
          
          let cmd = UpdateStatement("suggestion_question", "sq", ["question"], ["id"]);
          let data = [question, id];
          
          Update(cmd, data, (err, result) => {
              if (err) {
                  console.log(err);
              }
              
              console.log(result);
          });
          
          res.status(200).json({ msg: "success" });
          
      } catch (error) {
          res.status(500).json({ msg: "error" });
      }
  });

  router.post("/active", function (req, res) {
    try {
      let sql = SelectStatement("select * from suggestion_question where sq_status = ?", [STATUS_LOG.ACTIVE]);
  
      Select(sql, (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).json({ msg: "error" });
        }
        if (result.length != 0) {
          let data = DataModeling(result, "sq_");
          res.json({ msg: "success", data: data });
        } else {
          res.json({ msg: "success", data: result });
        }
      });
    } catch (error) {
      res.status(500).json({ msg: "error" });
    }
  });