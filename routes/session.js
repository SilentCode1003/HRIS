var express = require("express");
var router = express.Router();
const { Validator } = require("./controller/middleware");
const {
  SelectStatement,
  InsertStatement,
  GetCurrentDatetime,
} = require("./repository/customhelper");
const { Select, Insert } = require("./repository/dbconnect");
const jwt = require("jsonwebtoken");

router.get("/getsession", function (req, res, next) {
  let token = jwt.sign(
    JSON.stringify({
      project: "SUGGESTIONFORM",
      employeeid: req.session.employeeid,
      department: req.session.departmentname,
      date: GetCurrentDatetime(),
    }),
    process.env._SECRET_KEY
  );

  console.log("Employee ID: ",req.session.employeeid, "Department Name: ",req.session.departmentname);

  res.status(200).json({
    msg: "session",
    data: {
      employeeid: req.session.employeeid,
      department: req.session.departmentname,
      date: GetCurrentDatetime(),
    },
  });
});
module.exports = router;
