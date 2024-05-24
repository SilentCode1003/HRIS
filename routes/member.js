var express = require("express");
var router = express.Router();
const { Validator } = require("./controller/middleware");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('memberlayout', { title: 'Express' });
  Validator(req, res, "memberlayout", "member");
});

module.exports = router;
