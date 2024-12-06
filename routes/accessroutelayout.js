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
  // req.session.fullname = "DEV42";
  // req.session.employeeid = "999999";
  // req.session.accesstype = "Admin";

  // res.render("accessroutelayout", {
  //   image: req.session.image,
  //   employeeid: "999999",
  //   fullname: "DEV42",
  //   accesstype: "Admin",
  // });
  Validator(req, res, "accessroutelayout", "accessroutelayout");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `select 
    marl_id,
    marl_route,
    marl_layout,
    ma_accessname as marl_accessid,
    marl_createdby,
    marl_createddate,
    marl_status 
    from master_access_route_layout
    inner join master_access on marl_accessid = ma_accessid
    order by marl_id asc`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }


      if (result != 0) {
        let data = DataModeling(result, "marl_");
        res.json(JsonDataResponse(data));
      } else {
        res.json(JsonDataResponse(result));
      }
    });
  } catch (error) {
    console.error(error);
    res.json(JsonErrorResponse(error));
  }
});

router.post("/save", (req, res) => {
  try {
    let status = "ACTIVE";
    let createdby =
      req.session.personelid == null ? "DEV42" : req.session.personelid;
    let createddate = GetCurrentDatetime();
    const { route, layout, access } = req.body;
    let sql = InsertStatement("master_access_route_layout", "marl", [
      "route",
      "layout",
      "accessid",
      "status",
      "createdby",
      "createddate",
    ]);

    let data = [[route, layout, access, status, createdby, createddate]];
    let checkStatement = SelectStatement(
      "select * from master_access_route_layout where marl_route=? and marl_layout=? and marl_accessid=?",
      [route, layout, access]
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
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.put("/status", (req, res) => {
  try {
    let id = req.body.id;
    let status =
      req.body.status == GetValue(ACT()) ? GetValue(INACT()) : GetValue(ACT());
    let data = [status, id];

    let updateStatement = UpdateStatement(
      "master_access_route_layout",
      "marl",
      ["status"],
      ["id"]
    );

    Update(updateStatement, data, (err, result) => {
      if (err) {
        console.error("Error: ", err);
        res.json(JsonErrorResponse(err));
      }

      res.json(JsonSuccess());
    });
  } catch (error) {
    console.log(error);
    res.json(JsonErrorResponse(error));
  }
});

router.put("/edit", (req, res) => {
  try {
    const { route, layout, access, id } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (route) {
      data.push(route);
      columns.push("route");
    }

    if (layout) {
      data.push(layout);
      columns.push("layout");
    }

    if (access) {
      data.push(access);
      columns.push("accessid");
    }

    if (id) {
      data.push(id);
      arguments.push("id");
    }

    let updateStatement = UpdateStatement(
      "master_access_route_layout",
      "marl",
      columns,
      arguments
    );
    let checkStatement = SelectStatement(
      "select * from master_access_route_layout where marl_route = ? and marl_layout = ? and marl_accessid = ?",
      [route, layout, access]
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
