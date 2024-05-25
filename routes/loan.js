var express = require("express");
var router = express.Router();
const { Validator } = require("./controller/middleware");

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('loanlayout', { title: 'Express' });
  Validator(req, res, "loanlayout", "loan");
});

module.exports = router;
