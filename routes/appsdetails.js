const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
const verifyJWT = require("../middleware/authenticator");
const {
  SelectStatement,
  GetCurrentDate,
  UpdateStatement,
  InsertStatement,
} = require("./repository/customhelper");
const { SelectAll } = require("./utility/utility");
const {
  JsonDataResponse,
  JsonErrorResponse,
  JsonSuccess,
} = require("./repository/response");
const { Select, Update } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const { Insert } = require("./repository/hrmisdb");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('approvedleavelayout', { title: 'Express' });
  Validator(req, res, "appsdetailslayout", "appsdetails");
});

module.exports = router;

router.get("/load", async (req, res) => {
  try {
    let result = await SelectAll("apps_details", "ad_");
    console.log(result);
    res.status(200).json(JsonDataResponse(result));
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});

router.post("/save", (req, res) => {
  try {
    const { appimage, appname, appsdetails, appversion, appcreateby } =
      req.body;
    let appdate = GetCurrentDate();
    let insert_sql = InsertStatement(
      "apps_details",
      ["image", "name", "details", "version", "date", "createby"],
      [appimage, appname, appsdetails, appversion, appdate, appcreateby]
    );

    Insert(insert_sql, (error, result) => {
      if (error) {
        res.status(500).json(JsonErrorResponse(error));
      }

      res.status(200).json(JsonSuccess());
    });
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});

router.post("/getappsdetails", (req, res) => {
  try {
    const { appid } = req.body;

    let sql = SelectStatement("select * from apps_details where ad_id = ?", [
      appid,
    ]);

    Select(sql, (error, result) => {
      if (error) {
        res.status(500).json(JsonErrorResponse(error));
      }

      if (result.length == 0) {
        res.status(200).json(JsonDataResponse(result));
      } else {
        let data = DataModeling(result, "ad_");
        res.status(200).json(JsonDataResponse(data));
      }
    });
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});

router.post("/update", (req, res) => {
  try {
    const { appid, appimage, appname, appsdetails, appversion } = req.body;
    let appdate = GetCurrentDate();
    let appcreateby = req.session.fullname;
    let data = [
      appimage,
      appname,
      appsdetails,
      appversion,
      appdate,
      appcreateby,
      appid,
    ];

    let update_sql = UpdateStatement(
      "apps_details",
      "ad",
      ["image", "name", "details", "version", "date", "createby"],
      ["id"]
    );

    Update(update_sql, data, (error, result) => {
      if (error) {
        console.log(error);

        res.status(500).json(JsonErrorResponse(error));
      }

      res.status(200).json(JsonDataResponse(result));
    });
  } catch (error) {
    res.status(500).json(JsonErrorResponse(error));
  }
});
