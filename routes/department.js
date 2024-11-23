const mysql = require("./repository/hrmisdb");
const moment = require("moment");
var express = require("express");
const { Validator } = require("./controller/middleware");
var router = express.Router();
const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  Validator(req, res, "departmentlayout", "department");
});

module.exports = router;

router.post("/getdepartment", (req, res) => {
  try {
    let departmentid = req.body.departmentid;
    let sql = `SELECT
      md_departmentname as departmentname,
      md_departmenthead as departmenthead,
      md_status as status,
      md_departmenticon as departmenticon
      FROM master_department
      WHERE md_departmentid = '${departmentid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: result,
          });
        } else {
          res.status(404).json({
            msg: "Department not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching department data",
          error: error,
        });
      });
  } catch (error) {
    res.status(500).json({
      msg: "Internal server error",
      error: error,
    });
  }
});

router.get("/load", (req, res) => {
  try {
    let sql = "select * from master_department";

    mysql.Select(sql, "Master_Department", (err, result) => {
      if (err) console.error("Error: ", err);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: error,
    });
  }
});

router.post("/save", (req, res) => {
  try {
    let departmentname = req.body.departmentname;
    let departmenthead = req.body.departmenthead;
    let departmenticon = req.body.departmenticon;
    let createby = req.session.fullname;
    let createdate = currentDate.format("YYYY-MM-DD");
    let status = "Active";

    let data = [];

    data.push([
      departmentname,
      departmenthead,
      departmenticon,
      createby,
      createdate,
      status,
    ]);
    let query = `SELECT * FROM master_department WHERE md_departmentname = '${departmentname}'`;
    mysql.Select(query, "Master_Department", (err, result) => {
      if (err) console.error("Error: ", err);

      if (result.length != 0) {
        res.json({
          msg: "exist",
        });
      } else {
        mysql.InsertTable("master_department", data, (err, result) => {
          if (err) console.error("Error: ", err);

          res.json({
            msg: "success",
          });
        });
      }
    });
  } catch (error) {
    res.json({
      msg: "error",
    });
  }
});

router.post("/update", (req, res) => {
  try {
    let departmentid = req.body.departmentid;
    let departmentname = req.body.departmentname;
    let departmenticon = req.body.departmenticon;
    let createby = req.session.fullname;
    let departmenthead = req.body.departmenthead;
    let status = req.body.status;

    let sqlupdate = `UPDATE master_department SET   
      md_departmentname ='${departmentname}',
      md_departmenthead ='${departmenthead}',
      md_departmenticon = '${departmenticon}', 
      md_createdby = '${createby}', 
      md_status ='${status}' 
      WHERE md_departmentid ='${departmentid}'`;

    mysql
      .Update(sqlupdate)
      .then((result) => {
        res.json({
          msg: "success",
        });
      })
      .catch((error) => {
        res.json({
          msg: error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
    });
  }
});

router.get("/loaddepartmentcard", (req, res) => {
  try {
    let sql = `SELECT 
    md_departmentname AS DepartmentName,
    COALESCE(COUNT(me_id), 0) AS EmployeeCount,
    md_departmenticon AS Icon,
    md_departmentid AS DepartmentID
    FROM 
    master_department
    LEFT JOIN 
    master_employee  ON me_department = md_departmentid
    WHERE 
    md_status = 'Active' 
    AND me_jobstatus IN ('regular', 'probitionary','apprentice')
    GROUP BY 
    md_departmentname, md_departmenticon, md_departmentid
    ORDER BY 
    md_departmentid`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
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

router.post("/loadmodal", (req, res) => {
  try {
    let departmentid = req.body.departmentid;
    let sql = `    SELECT
    me_profile_pic AS profilePicturePath,
    me_id AS newEmployeeId,
    md_departmentname as departmentName,
    CONCAT(me_firstname, ' ', me_lastname) AS firstname,
    me_phone AS phone,
    me_email AS email,
    mp_positionname AS position,
    CONCAT(
     TIMESTAMPDIFF(YEAR, me_hiredate, CURRENT_DATE), ' Years ',
     TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) % 12, ' Months ',
     DATEDIFF(CURRENT_DATE, DATE_ADD(me_hiredate, INTERVAL TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) MONTH)), ' Days'
   ) AS tenure
    FROM
    master_employee
    LEFT JOIN
    master_position ON master_employee.me_position = mp_positionid
    LEFT JOIN 
    master_department ON master_employee.me_department = md_departmentid
    WHERE
    md_departmentid = '${departmentid}'
    and  me_jobstatus IN ('regular', 'probitionary', 'apprentice')`;
    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result,
        });
      })
      .catch((error) => {
        res.json({
          msg: "error",
          error,
        });
      });
  } catch (error) {
    res.json({
      msg: "error",
      error,
    });
  }
});
