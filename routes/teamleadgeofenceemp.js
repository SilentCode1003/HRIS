const mysql = require("./repository/hrmisdb");
//const moment = require('moment');
var express = require("express");
const { Validator } = require("./controller/middleware");
const { Select, Update } = require("./repository/dbconnect");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
} = require("./repository/response");
const { DataModeling } = require("./model/hrmisdb");
const { de } = require("date-fns/locale");
const {
  UpdateStatement,
  GetCurrentDatetime,
} = require("./repository/customhelper");
var router = express.Router();
//const currentDate = moment();

/* GET home page. */

router.get("/", function (req, res, next) {
  // Validator(req, res, "indexlayout");
  Validator(req, res, "teamleadgeofenceemplayout", "teamleadgeofenceemp");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let subgroupid = req.session.subgroupid;

    let sql = `SELECT
      mu_userid,
      CONCAT(me_lastname,' ',me_firstname) as mu_fullname,
      s_name as mu_subgroupname,
      CASE WHEN mu_isgeofence = 1 
      THEN 'Active' ELSE 'Inactive' END AS mu_isgeofence,
      ma_accessname as mu_accesstype,
      mu_createby,
      mu_createdate
      FROM master_user
      INNER JOIN master_employee ON master_user.mu_employeeid = me_id
      INNER JOIN subgroup ON master_user.mu_subgroupid = s_id
      INNER JOIN master_access ON master_user.mu_accesstype = ma_accessid
      WHERE me_department = '${departmentid}'
      AND mu_subgroupid = '${subgroupid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }
      if (result != 0) {
        let data = DataModeling(result, "mu_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    res.json(JsonErrorResponse(error));
  }
});

router.put("/status", (req, res) => {
    try {
      const userid = req.body.userid;
      const isgeofence = req.body.isgeofence;
      const createby = req.session.fullname;
      const createdate = GetCurrentDatetime();
  
      const data = [];
      const columns = [];
      const whereClause = [];
  
      const newIsgeofenceValue = isgeofence === "Active" ? 0 : 1;
  
      if (newIsgeofenceValue !== undefined) { // Explicitly check for undefined
        data.push(newIsgeofenceValue);
        columns.push("isgeofence"); // Assuming the correct column name is mu_isgeofence
      }
  
      if (createby) {
        data.push(createby);
        columns.push("createby");
      }
  
      if (createdate) {
        data.push(createdate);
        columns.push("createdate");
      }
  
      if (userid) {
        whereClause.push("userid");
        data.push(userid);
      }
  
      const updateStatement = UpdateStatement(
        "master_user",
        "mu",
        columns,
        whereClause
      );
  
      console.log(updateStatement);
  
      Update(updateStatement, data, (err, result) => {
        if (err) {
          console.error("Error: ", err);
          return res.json(JsonErrorResponse(err));
        }
  
        res.json(JsonSuccess());
      });
    } catch (error) {
      console.error(error);
      res.json(JsonErrorResponse(error));
    }
  });
