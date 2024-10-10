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

  res.cookie('employeeid', req.session.employeeid, {
    domain: '.5lsolutions.com',  // Allows access across subdomains
    secure: true,
    sameSite: 'None'
  });

  res.cookie('department', req.session.departmentname, {
    domain: '.5lsolutions.com',  // Allows access across subdomains
    secure: true,
    sameSite: 'None'
  });


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
