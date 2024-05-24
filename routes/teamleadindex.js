const mysql = require("./repository/hrmisdb");
//const moment = require('moment');
var express = require("express");
const { ValidatorForTeamLead } = require("./controller/middleware");
var router = express.Router();
//const currentDate = moment();

/* GET home page. */
router.get("/", function (req, res, next) {
  ValidatorForTeamLead(req, res, "teamleadindexlayout", "teamleadindex");
});

module.exports = router;

router.get("/attendancestatus", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `
    SELECT
    me.me_profile_pic as image,
    concat(me.me_lastname,' ',me.me_firstname) as FullName,
    TIME_FORMAT(ma.ma_clockin, '%h:%i %p') AS actual_clockin,
    CASE
        WHEN WEEKDAY(ma.ma_attendancedate) = 0 THEN JSON_UNQUOTE(ms.ms_monday->'$.time_in')
        WHEN WEEKDAY(ma.ma_attendancedate) = 1 THEN JSON_UNQUOTE(ms.ms_tuesday->'$.time_in')
        WHEN WEEKDAY(ma.ma_attendancedate) = 2 THEN JSON_UNQUOTE(ms.ms_wednesday->'$.time_in')
        WHEN WEEKDAY(ma.ma_attendancedate) = 3 THEN JSON_UNQUOTE(ms.ms_thursday->'$.time_in')
        WHEN WEEKDAY(ma.ma_attendancedate) = 4 THEN JSON_UNQUOTE(ms.ms_friday->'$.time_in')
        WHEN WEEKDAY(ma.ma_attendancedate) = 5 THEN JSON_UNQUOTE(ms.ms_saturday->'$.time_in')
        WHEN WEEKDAY(ma.ma_attendancedate) = 6 THEN JSON_UNQUOTE(ms.ms_sunday->'$.time_in')
    END AS scheduled_time_in,
    TIMESTAMPDIFF(MINUTE, 
        CONCAT(CAST(ma.ma_attendancedate AS DATE), ' ', 
        CASE
            WHEN WEEKDAY(ma.ma_attendancedate) = 0 THEN JSON_UNQUOTE(ms.ms_monday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 1 THEN JSON_UNQUOTE(ms.ms_tuesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 2 THEN JSON_UNQUOTE(ms.ms_wednesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 3 THEN JSON_UNQUOTE(ms.ms_thursday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 4 THEN JSON_UNQUOTE(ms.ms_friday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 5 THEN JSON_UNQUOTE(ms.ms_saturday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 6 THEN JSON_UNQUOTE(ms.ms_sunday->'$.time_in')
        END), 
        ma.ma_clockin
    ) AS minutes_late
FROM
    master_attendance ma
JOIN
    master_shift ms ON ma.ma_employeeid = ms.ms_employeeid
JOIN master_employee me ON ma.ma_employeeid = me.me_id
WHERE
    ma.ma_attendancedate = CURDATE()
    AND me.me_department = '${departmentid}'
    AND ma.ma_clockin IS NOT NULL
    AND (
        CASE
            WHEN WEEKDAY(ma.ma_attendancedate) = 0 THEN JSON_UNQUOTE(ms.ms_monday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 1 THEN JSON_UNQUOTE(ms.ms_tuesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 2 THEN JSON_UNQUOTE(ms.ms_wednesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 3 THEN JSON_UNQUOTE(ms.ms_thursday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 4 THEN JSON_UNQUOTE(ms.ms_friday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 5 THEN JSON_UNQUOTE(ms.ms_saturday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 6 THEN JSON_UNQUOTE(ms.ms_sunday->'$.time_in')
        END
    ) IS NOT NULL
    AND ma.ma_clockin > CONCAT(CAST(ma.ma_attendancedate AS DATE), ' ', 
        CASE
            WHEN WEEKDAY(ma.ma_attendancedate) = 0 THEN JSON_UNQUOTE(ms.ms_monday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 1 THEN JSON_UNQUOTE(ms.ms_tuesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 2 THEN JSON_UNQUOTE(ms.ms_wednesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 3 THEN JSON_UNQUOTE(ms.ms_thursday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 4 THEN JSON_UNQUOTE(ms.ms_friday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 5 THEN JSON_UNQUOTE(ms.ms_saturday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 6 THEN JSON_UNQUOTE(ms.ms_sunday->'$.time_in')
        END)
ORDER BY
    minutes_late DESC`;

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

router.get("/countcoacard", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `    
    SELECT 
    count(*) AS COA
    FROM 
    attendance_request
    INNER JOIN master_employee ON attendance_request.ar_employeeid = me_id
    WHERE 
    ar_status = 'Pending'
    AND me_department = '${departmentid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              COACount: result[0].COA,
            },
          });
        } else {
          res.status(404).json({
            msg: "Data not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching employee data",
          error: error,
        });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/countovertimecard", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `    
    SELECT 
    count(*) AS AOT
    FROM 
    payroll_approval_ot
    INNER JOIN master_employee ON payroll_approval_ot.pao_employeeid = me_id
    WHERE 
    pao_status = 'Appllied'
    AND me_department = '${departmentid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              AOTCount: result[0].AOT,
            },
          });
        } else {
          res.status(404).json({
            msg: "Data not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching employee data",
          error: error,
        });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/countleavecard", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `    
    SELECT 
    count(*) AS LEAVES
    FROM 
    leaves
    INNER JOIN master_employee ON leaves.l_employeeid = me_id
    WHERE 
    l_leavestatus = 'Pending'
    AND me_department = '${departmentid}'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              LEAVESCount: result[0].LEAVES,
            },
          });
        } else {
          res.status(404).json({
            msg: "Data not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching employee data",
          error: error,
        });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/countattendancebadge", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `SELECT
    COUNT(*) AS LATE
FROM
    master_attendance ma
JOIN
    master_shift ms ON ma.ma_employeeid = ms.ms_employeeid
JOIN master_employee me ON ma.ma_employeeid = me.me_id
WHERE
    ma.ma_attendancedate = CURDATE()
    AND me.me_department = '${departmentid}'
    AND ma.ma_clockin IS NOT NULL
    AND (
        CASE
            WHEN WEEKDAY(ma.ma_attendancedate) = 0 THEN JSON_UNQUOTE(ms.ms_monday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 1 THEN JSON_UNQUOTE(ms.ms_tuesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 2 THEN JSON_UNQUOTE(ms.ms_wednesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 3 THEN JSON_UNQUOTE(ms.ms_thursday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 4 THEN JSON_UNQUOTE(ms.ms_friday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 5 THEN JSON_UNQUOTE(ms.ms_saturday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 6 THEN JSON_UNQUOTE(ms.ms_sunday->'$.time_in')
        END
    ) IS NOT NULL
    AND ma.ma_clockin > CONCAT(CAST(ma.ma_attendancedate AS DATE), ' ', 
        CASE
            WHEN WEEKDAY(ma.ma_attendancedate) = 0 THEN JSON_UNQUOTE(ms.ms_monday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 1 THEN JSON_UNQUOTE(ms.ms_tuesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 2 THEN JSON_UNQUOTE(ms.ms_wednesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 3 THEN JSON_UNQUOTE(ms.ms_thursday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 4 THEN JSON_UNQUOTE(ms.ms_friday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 5 THEN JSON_UNQUOTE(ms.ms_saturday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 6 THEN JSON_UNQUOTE(ms.ms_sunday->'$.time_in')
        END)`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              LATECount: result[0].LATE,
            },
          });
        } else {
          res.status(404).json({
            msg: "Data not found",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({
          msg: "Error fetching employee data",
          error: error,
        });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/totalcoa", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `SELECT 
    concat(me_lastname,' ',me_firstname) as ar_employeeid,
    DATE_FORMAT(ar_attendace_date, '%W, %M %e, %Y') AS ar_attendace_date,
    TIME_FORMAT(ar_timein, '%h:%i %p') ar_timein, 
    TIME_FORMAT(ar_timeout, '%h:%i %p') ar_timeout,
    ar_total,
    ar_reason
    FROM attendance_request
    INNER JOIN master_employee ON attendance_request.ar_employeeid = me_id
    WHERE ar_status = 'Pending'
    AND me_department = '${departmentid}'`;

    mysql.Select(sql, "Attendance_Request", (err, result) => {
      if (err) console.error("Error :!!", err);

      console.log(result);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.get("/totalot", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `SELECT 
    pao_fullname,
    DATE_FORMAT(pao_attendancedate, '%W, %M %e, %Y') AS pao_attendancedate,
    TIME_FORMAT(pao_clockin, '%h:%i %p') pao_clockin, 
    TIME_FORMAT(pao_clockout, '%h:%i %p') pao_clockout,
    pao_total_hours,
    pao_reason
    FROM payroll_approval_ot
    INNER JOIN master_employee ON payroll_approval_ot.pao_employeeid = me_id
    WHERE pao_status = 'Appllied'
    AND me_department = '${departmentid}'`;

    mysql.Select(sql, "Payroll_Approval_Ot", (err, result) => {
      if (err) console.error("Error :!!", err);

      console.log(result);

      res.json({
        msg: "success",
        data: result,
      });
    });
  } catch (error) {
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.get("/totalleave", (req, res) => {
  try {
    let departmentid = req.session.departmentid;
    let sql = `SELECT 
    concat(me_lastname,' ',me_firstname) as FullName,
    DATE_FORMAT(l_leavestartdate, '%W, %M %e, %Y') AS startdate,
    DATE_FORMAT(l_leaveenddate, '%W, %M %e, %Y') AS enddate,
    l_leavetype as leavetype,
    l_leaveapplieddate as applieddate,
    l_leavereason as leavereason,
    CASE
        WHEN DATEDIFF(l_leaveenddate, l_leavestartdate) = 1 THEN '1 day'
        ELSE CONCAT(DATEDIFF(l_leaveenddate, l_leavestartdate), ' days')
    END AS leave_duration
FROM 
    leaves
INNER JOIN 
    master_employee ON leaves.l_employeeid = me_id
WHERE 
    l_leavestatus = 'Pending'
    AND me_department = '${departmentid}'`;

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

router.post("/searchemployee", (req, res) => {
  try {
    const { search } = req.body;
    let departmentid = req.session.departmentid;
    let firstName = "";
    let lastName = "";

    const lastSpaceIndex = search.lastIndexOf(" ");
    if (lastSpaceIndex !== -1) {
      firstName = search.substring(0, lastSpaceIndex);
      lastName = search.substring(lastSpaceIndex + 1);
    } else {
      firstName = search;
    }

    let sql = `SELECT me_id, me_firstname, me_lastname, me_profile_pic FROM master_employee WHERE 1 AND me_department = '${departmentid}'`;

    if (firstName) {
      sql += ` AND me_firstname LIKE '%${firstName}%'`;
    }

    if (lastName) {
      sql += ` AND me_lastname LIKE '%${lastName}%'`;
    }

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        const employees = result.map((employee) => ({
          employeeid: employee.me_id,
          name: `${employee.me_firstname} ${employee.me_lastname}`,
          profilePic: employee.me_profile_pic,
        }));
        res.json({
          msg: "success",
          data: employees,
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
