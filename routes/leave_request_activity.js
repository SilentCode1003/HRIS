const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  //res.render('ojtindexlayout', { title: 'Express' });
  Validator(req, res, "leave_request_activitylayout");
});

module.exports = router;

router.get("/load", (req, res) => {
  try {
    let sql = `SELECT 
    lra.lra_id AS leaverequestid,
    CONCAT(me_request.me_lastname, ' ', me_request.me_firstname) AS employeeid,
    l.l_leavestartdate AS leavestartdate,
    l.l_leaveenddate AS leaveenddate,
    ml.ml_leavetype AS leavetype,
    l.l_leaveapplieddate AS leaveapplieddate,
    CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS approver,
    lra.lra_date as actiondate,
    lra.lra_status AS status
    FROM leave_request_activity lra
    INNER JOIN leaves l ON lra.lra_leaveid = l.l_leaveid
    INNER JOIN master_employee me_request ON l.l_employeeid = me_request.me_id
    INNER JOIN master_employee me_activity ON lra.lra_employeeid = me_activity.me_id
    INNER JOIN master_leaves ml ON l.l_leavetype = ml.ml_id;`;

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      res.json({
        msg:'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg:'error',
        data: error,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});


router.post("/getleaveactivity", (req, res) => {
  try {
    let leaverequestid = req.body.leaverequestid;
    let sql = `SELECT 
    CONCAT(me_request.me_lastname, ' ', me_request.me_firstname) AS employeeid,
    l.l_leavestartdate AS leavestartdate,
    l.l_leaveenddate AS leaveenddate,
    ml.ml_leavetype AS leavetype,
    l.l_leavereason AS leavereason,
    l.l_image AS image,
    l.l_leavestatus AS leavestatus,
    l.l_leaveapplieddate AS leaveapplieddate,
    l.l_comment AS comment,
    l.l_leaveduration AS leaveduration,
    l.l_leavepaiddays AS leavepaiddays,
    l.l_leaveunpaiddays AS leaveunpaiddays,
    CONCAT(me_activity.me_lastname, ' ', me_activity.me_firstname) AS approver,
    lra.lra_date AS actiondate,
    lra.lra_status AS status,
    s.s_name as subgroupname,
    l_approvalcount as approvecount,
    lra.lra_comment AS actioncomment
    FROM leave_request_activity lra
    INNER JOIN leaves l ON lra.lra_leaveid = l.l_leaveid
    INNER JOIN master_employee me_request ON l.l_employeeid = me_request.me_id
    INNER JOIN master_employee me_activity ON lra.lra_employeeid = me_activity.me_id
    INNER JOIN master_leaves ml ON l.l_leavetype = ml.ml_id
	INNER JOIN subgroup s on lra.lra_subgroupid = s.s_id
    WHERE lra_id = '${leaverequestid}'`;

    mysql.mysqlQueryPromise(sql)
    .then((result) => {
      res.json({
        msg:'success',
        data: result,
      });
    })
    .catch((error) => {
      res.json({
        msg:'error',
        data: error,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});


