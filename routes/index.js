const mysql = require("./repository/hrmisdb");
var express = require("express");
const { Validator } = require("./controller/middleware");
const {
  JsonErrorResponse,
  JsonDataResponse,
  JsonSuccess,
} = require("./repository/response");
const { Select, Update } = require("./repository/dbconnect");
const { DataModeling } = require("./model/hrmisdb");
const {
  UpdateStatement,
  SelectStatement,
  GetCurrentDate,
  GetCurrentMonthFirstDay,
  GetCurrentMonthLastDay,
  ConvertToDate,
} = require("./repository/customhelper");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  // Validator(req, res, "indexlayout");

  Validator(req, res, "indexlayout", "index");
});

module.exports = router;

//#region LOAD TABLE DASHBOARD

router.get("/load", (req, res) => {
  try {
    let sql = `select
    l_leaveid as leaveid ,
    me_id as newEmployeeId,
    concat(me_lastname,' ',me_firstname) as firstname,
    l_leavestartdate as leavestartdate,
    l_leaveenddate as leaveenddate,
    l_leavetype as leavetype,
    l_leavereason reason,
    l_leaveapplieddate as applieddate
    from leaves
    left join master_employee on leaves.l_employeeid = me_id
    where l_leavestatus = 'Pending'
    order by l_leaveid desc`;

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
    console.log(error);
  }
});

router.post("/getleave", (req, res) => {
  try {
    let leaveid = req.body.leaveid;
    let sql = `SELECT
    l_leaveid as leaveid,
    concat(me_lastname,' ',me_firstname) as fullname,
    l_employeeid as employee,
    ml_leavetype as leavetype,
    l_leavestartdate as leavestartdate,
    l_leaveenddate as leaveenddate,
    l_leavereason as leavereason,
    l_leaveapplieddate as leaveapplieddate,
    l_image as leaveimage,
    ml_totalleavedays as totalleavedays,
    ml_unusedleavedays as unusedleave,
    ml_usedleavedays as usedleave,
    ml_year as leaveyear,
    l_leavestatus as leavestatus,
    l_leaveduration as leaveduration,
    l_leavepaiddays as leavepaiddays,
    l_leaveunpaiddays as leaveunpaiddays,
    l_subgroupid as leavesubgroupid
    FROM
    leaves 
    INNER JOIN master_leaves on leaves.l_leavetype = ml_id
    INNER JOIN master_employee on leaves.l_employeeid = me_id
    INNER JOIN subgroup on leaves.l_subgroupid = s_id
    where l_leaveid = '${leaveid}'`;

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
    res.json({
      msg: error,
    });
  }
});

router.get("/loadCA", (req, res) => {
  try {
    let sql = `   
    select
    ca_cashadvanceid as employeeid,
    concat(me_lastname,' ',me_firstname) as firstname,
    ca_requestdate as requestdate,
    ca_amount as amount,
    ca_purpose as purpose,
    ca_status as status
    from cash_advance
    left join master_employee on cash_advance.ca_employeeid = me_id
    where ca_status = 'Pending'
    order by ca_cashadvanceid desc`;

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
      msg: error,
    });
  }
});

router.get("/loadreqOT", (req, res) => {
  try {
    let sql = `   
    SELECT 
    pao_id,
    pao_fullname,
    DATE_FORMAT(pao_attendancedate, '%W, %M %d, %Y') as pao_attendancedate,
    DATE_FORMAT(pao_payroll_date, '%W, %M %d, %Y') as  pao_payroll_date, 
    DATE_FORMAT(pao_clockin, '%Y-%m-%d %H:%i:%s') as pao_clockin,  
    DATE_FORMAT(pao_clockout, '%Y-%m-%d %H:%i:%s') as  pao_clockout,
    pao_total_hours
    FROM payroll_approval_ot
    WHERE pao_status = 'Applied'
    order by pao_id ASC`;

    mysql.Select(sql, "Payroll_Approval_Ot", (err, result) => {
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

router.get("/loadreqattendance", (req, res) => {
  try {
    let sql = `   
    SELECT 
    ar_requestid,
    concat(me_lastname,' ' ,me_firstname) as  ar_employeeid,
    DATE_FORMAT(ar_attendace_date, '%W, %M %d, %Y') as ar_attendace_date,
    DATE_FORMAT(ar_timein, '%Y-%m-%d %H:%i:%s') as ar_timein,  
    DATE_FORMAT(ar_timeout, '%Y-%m-%d %H:%i:%s') as  ar_timeout,
    ar_total
    FROM attendance_request
    INNER JOIN master_employee on ar_employeeid = me_id
    WHERE ar_status = 'Pending'
    order by ar_requestid ASC`;

    mysql.Select(sql, "Attendance_Request", (err, result) => {
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

router.get("/loadHoliday", (req, res) => {
  try {
    let sql = `SELECT
    ph_holidayid,
    CONCAT(me_lastname,' ',me_firstname) as ph_fullname,
    DATE_FORMAT(ph_attendancedate, '%Y-%m-%d') AS ph_attendancedate,
    ph_holidaytype,
    DATE_FORMAT(ph_payrolldate, '%Y-%m-%d') AS ph_payrolldate,
    DATE_FORMAT(ph_timein, '%Y-%m-%d %h:%i:%s') AS ph_timein,
    DATE_FORMAT(ph_timeout, '%Y-%m-%d %h:%i:%s') AS ph_timeout,
    ph_total_hours
    FROM payroll_holiday
    INNER JOIN master_employee ON payroll_holiday.ph_employeeid = me_id
    WHERE ph_status = 'Applied'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ph_");
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

router.post("/getholidayapproval", (req, res) => {
  try {
    let holidayid = req.body.holidayid;
    let sql = `SELECT
    ph_holidayid,
    CONCAT(me_lastname,' ',me_firstname) as ph_fullname,
    DATE_FORMAT(ph_attendancedate, '%Y-%m-%d') AS ph_attendancedate,
    ph_holidaytype,
    DATE_FORMAT(ph_payrolldate, '%Y-%m-%d') AS ph_payrolldate,
    DATE_FORMAT(ph_timein, '%Y-%m-%d %h:%i:%s') AS ph_timein,
    DATE_FORMAT(ph_timeout, '%Y-%m-%d %h:%i:%s') AS ph_timeout,
    ph_total_hours,
    ph_file,
    DATE_FORMAT(ph_holidaydate, '%Y-%m-%d') AS ph_holidaydate,
    s_name as ph_subgroupid,
    ph_status,
    ph_normal_ot_total,
    ph_nightdiff_ot_total
    FROM payroll_holiday
    INNER JOIN master_employee ON payroll_holiday.ph_employeeid = me_id
    INNER JOIN subgroup ON payroll_holiday.ph_subgroupid = s_id
    WHERE ph_holidayid = '${holidayid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "ph_");
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

router.put("/holidayaction", (req, res) => {
  try {
    const { holidayid, payrolldate, status, comment } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (comment) {
      data.push(comment);
      columns.push("admin_comment");
    }

    if (status) {
      data.push(status);
      columns.push("status");
    }

    if (payrolldate) {
      data.push(payrolldate);
      columns.push("payrolldate");
    }

    if (holidayid) {
      data.push(holidayid);
      arguments.push("holidayid");
    }

    let updateStatement = UpdateStatement(
      "payroll_holiday",
      "ph",
      columns,
      arguments
    );

    let checkStatement = SelectStatement(
      "select * from payroll_holiday where ph_holidayid = ? and ph_status = ?",
      [holidayid, status]
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

router.get("/loadrdot", (req, res) => {
  try {
    let sql = `SELECT
    roa_rdotid,
    roa_fullname,
    DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
    DATE_FORMAT(roa_timein, '%Y-%m-%d %h:%i:%s') AS roa_timein,
    DATE_FORMAT(roa_timeout, '%Y-%m-%d %h:%i:%s') AS roa_timeout,
    DATE_FORMAT(roa_payrolldate, '%Y-%m-%d') AS roa_payrolldate,
    roa_total_hours 
    FROM restday_ot_approval
    INNER JOIN subgroup ON restday_ot_approval.roa_subgroupid = s_id
    WHERE roa_status = 'Applied'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "roa_");
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

router.post("/getrdotapproval", (req, res) => {
  try {
    let rdotid = req.body.rdotid;
    let sql = `SELECT
    roa_rdotid,
    roa_fullname,
    DATE_FORMAT(roa_attendancedate, '%Y-%m-%d') AS roa_attendancedate,
    DATE_FORMAT(roa_timein, '%Y-%m-%d %h:%i:%s') AS roa_timein,
    DATE_FORMAT(roa_timeout, '%Y-%m-%d %h:%i:%s') AS roa_timeout,
    roa_total_hours,
    s_name as roa_subgroupid,
    DATE_FORMAT(roa_payrolldate, '%Y-%m-%d') AS roa_payrolldate,
    roa_file,
    roa_status
    FROM restday_ot_approval
    INNER JOIN subgroup ON restday_ot_approval.roa_subgroupid = s_id
    WHERE roa_rdotid = '${rdotid}'`;

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.json(JsonErrorResponse(err));
      }

      if (result != 0) {
        let data = DataModeling(result, "roa_");
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

router.put("/rdotaction", (req, res) => {
  try {
    const { rdotid, payrolldate, status, comment } = req.body;

    let data = [];
    let columns = [];
    let arguments = [];

    if (comment) {
      data.push(comment);
      columns.push("admin_comment");
    }

    if (status) {
      data.push(status);
      columns.push("status");
    }

    if (payrolldate) {
      data.push(payrolldate);
      columns.push("payrolldate");
    }

    if (rdotid) {
      data.push(rdotid);
      arguments.push("rdotid");
    }

    let updateStatement = UpdateStatement(
      "restday_ot_approval",
      "roa",
      columns,
      arguments
    );

    let checkStatement = SelectStatement(
      "select * from restday_ot_approval where roa_rdotid = ? and roa_status = ?",
      [rdotid, status]
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

router.get("/getbulletin", (req, res) => {
  try {
    let sql = `
    SELECT
    mb_image AS image,
    mb_tittle AS title,
    mb_type as type,
    mb_targetdate as targetdate,
    mb_description AS description
    FROM master_bulletin
    WHERE (mb_type = 'Announcement' OR (mb_type = 'Event' AND mb_targetdate >= CURDATE()))`;

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
    res.json({
      msg: error,
    });
  }
});

router.get("/attendancestatus", (req, res) => {
  try {
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
		
	CASE WHEN (CASE
            WHEN WEEKDAY(ma.ma_attendancedate) = 0 THEN JSON_UNQUOTE(ms.ms_monday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 1 THEN JSON_UNQUOTE(ms.ms_tuesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 2 THEN JSON_UNQUOTE(ms.ms_wednesday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 3 THEN JSON_UNQUOTE(ms.ms_thursday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 4 THEN JSON_UNQUOTE(ms.ms_friday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 5 THEN JSON_UNQUOTE(ms.ms_saturday->'$.time_in')
            WHEN WEEKDAY(ma.ma_attendancedate) = 6 THEN JSON_UNQUOTE(ms.ms_sunday->'$.time_in')
        END) = '00:00:00' THEN 'RESTDAY OT'
        ELSE TIMESTAMPDIFF(MINUTE, 
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
    )END AS minutes_late
FROM
    master_attendance ma
JOIN
    master_shift ms ON ma.ma_employeeid = ms.ms_employeeid
JOIN master_employee me ON ma.ma_employeeid = me.me_id
WHERE
    ma.ma_attendancedate = CURDATE()
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

router.get("/countattendancebadge", (req, res) => {
  try {
    let sql = `SELECT
    COUNT(*) AS LATE
FROM
    master_attendance ma
JOIN
    master_shift ms ON ma.ma_employeeid = ms.ms_employeeid
JOIN master_employee me ON ma.ma_employeeid = me.me_id
WHERE
    ma.ma_attendancedate = CURDATE()
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

//#endregion

//#region DASH BOARD CARD

router.get("/countreqleavebadge", (req, res) => {
  try {
    let sql = `    
      SELECT count(*) as pending
      from leaves 
      where 
      l_leavestatus = 'Pending'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              leavereqCount: result[0].pending,
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

router.get("/countcashreqbadge", (req, res) => {
  try {
    let sql = `    
      SELECT count(*) as pending
      from cash_advance 
      where 
      ca_status = 'Pending'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              CAreqCount: result[0].pending,
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

router.get("/countovertimeot", (req, res) => {
  try {
    let sql = `    
    SELECT count(*) as pending
    from payroll_approval_ot 
    where 
    pao_status = 'Applied'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              OTreqCount: result[0].pending,
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

router.get("/countCOA", (req, res) => {
  try {
    let sql = `    
    SELECT count(*) as pending
    from attendance_request 
    where 
    ar_status = 'Pending'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              COAreqCount: result[0].pending,
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

router.get("/countholiday", (req, res) => {
  try {
    let sql = `    
    SELECT count(*) as Applied
    from payroll_holiday 
    where 
    ph_status = 'Applied'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              HOLIDAYreqCount: result[0].Applied,
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

router.get("/countrdot", (req, res) => {
  try {
    let sql = `    
    SELECT count(*) as Applied
    from restday_ot_approval 
    where 
    roa_status = 'Applied'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              RDOTreqCount: result[0].Applied,
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

router.get("/countactive", (req, res) => {
  try {
    let sql = `    
      SELECT 
        count(*) AS Active
        FROM 
        master_employee
        WHERE 
        me_jobstatus IN ('regular', 'probitionary', 'apprentice')`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              activeCount: result[0].Active,
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

router.get("/countresigned", (req, res) => {
  try {
    let sql = `    
      SELECT 
      COUNT(*) AS Resigned
      FROM 
      master_resigned
      WHERE 
      mr_status = 'resigned'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              resignedCount: result[0].Resigned,
            },
          });
        } else {
          res.status(404).json({
            msg: "Department not found",
          });
        }
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({
          msg: "Error fetching department data",
          error: error,
        });
      });
  } catch (error) {
    console.log(error);
  }
});

router.get("/countprobitionary", (req, res) => {
  try {
    let sql = `    
    SELECT 
    COUNT(*) AS Probitionary
    FROM 
    master_employee
    WHERE 
    me_jobstatus = 'probitionary'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              probitionaryCount: result[0].Probitionary,
            },
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
    console.log(error);
  }
});

router.get("/countregular", (req, res) => {
  try {
    let sql = `    
    SELECT 
    COUNT(*) AS Regular
    FROM 
    master_employee
    WHERE 
    me_jobstatus = 'regular'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              regularCount: result[0].Regular,
            },
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
    console.log(error);
  }
});

router.get("/countadmin", (req, res) => {
  try {
    let sql = `    
    SELECT 
    COUNT(*) AS Admin
    FROM 
    master_employee
    WHERE 
    me_department = '1'
    and  me_jobstatus IN ('regular', 'probitionary')`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              adminCount: result[0].Admin,
            },
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
    console.log(error);
  }
});

router.get("/countit", (req, res) => {
  try {
    let sql = `    
    SELECT 
    COUNT(*) AS IT
    FROM 
    master_employee
    WHERE 
    me_department = '2'
    and  me_jobstatus IN ('regular', 'probitionary')`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              ITCount: result[0].IT,
            },
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
    console.log(error);
  }
});

router.get("/countcabling", (req, res) => {
  try {
    let sql = `    
    SELECT 
    COUNT(*) AS Cabling
    FROM 
    master_employee
    WHERE 
    me_department = '3'
    and  me_jobstatus IN ('regular', 'probitionary')`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        if (result.length > 0) {
          res.status(200).json({
            msg: "success",
            data: {
              CablingCount: result[0].Cabling,
            },
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
    console.log(error);
  }
});

router.get("/countcandidate", (req, res) => {
  try {
    let sql = `SELECT 
    COUNT(*) AS Candidate
    FROM master_employee
    WHERE me_jobstatus = 'probitionary'
    AND TIMESTAMPDIFF(MONTH, me_hiredate, CURDATE()) >= 5`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: {
            CandidateCount: result[0].Candidate,
          },
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

router.get("/countbagapuro", (req, res) => {
  try {
    let sql = `    
    SELECT COUNT(*) AS Bagapuro
    FROM master_employee
    WHERE UPPER(me_firstname) = 'BAGAPURO' OR UPPER(me_lastname) = 'BAGAPURO'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: {
            BagapuroCount: result[0].Bagapuro,
          },
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

router.get("/countapprentice", (req, res) => {
  try {
    let sql = `    
    SELECT COUNT(*) AS Apprentice
    FROM master_employee
    WHERE me_jobstatus = 'apprentice'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: {
            ApprenticeCount: result[0].Apprentice,
          },
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

router.get("/count1year", (req, res) => {
  try {
    let sql = `    
    SELECT 
    COUNT(*) AS YEARS_1
    FROM 
    (
 SELECT 
    me_id AS employeeid,
    CONCAT(me_firstname, ' ', me_lastname) AS firstname,
    md_departmentname AS department,
    mp_positionname AS position,
    me_phone AS contact,
    CONCAT(
        TIMESTAMPDIFF(YEAR, me_hiredate, CURRENT_DATE), ' Years '
    ) AS tenure
    FROM 
    master_employee
    LEFT JOIN 
    master_department md ON master_employee.me_department = md_departmentid
    LEFT JOIN 
    master_position ON master_employee.me_position = mp_positionid
    where me_jobstatus in ('regular')) as result
    where tenure = '1 Years'`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: {
            Years1Count: result[0].YEARS_1,
          },
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

//#endregion

//#region MODAL DASH BOARD

router.get("/getbday", (req, res) => {
  try {
    let sql = ` SELECT 
    me_profile_pic,
    CONCAT(me_firstname, ' ', me_lastname) AS me_firstname,
    DATE_FORMAT(me_birthday, '%M %e') AS me_birthday
  FROM 
    master_employee
  WHERE 
    MONTH(me_birthday) = MONTH(CURRENT_DATE) 
    AND me_jobstatus IN ('regular','probitionary','apprentice')
  ORDER BY 
    me_birthday`;

    mysql.Select(sql, "Master_Employee", (err, result) => {
      if (err) console.log("Error", err);

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

router.get("/getbdaytoday", (req, res) => {
  try {
    let sql = `SELECT 
    me_profile_pic,
    CONCAT(me_firstname, ' ', me_lastname) AS me_firstname,
    DATE_FORMAT(me_birthday, '%M %e') AS me_birthday
FROM 
    master_employee
WHERE 
    DAY(me_birthday) = DAY(CURRENT_DATE)
    AND MONTH(me_birthday) = MONTH(CURRENT_DATE)
    AND me_jobstatus IN ('regular', 'probitionary', 'apprentice')
ORDER BY 
    me_birthday`;

    mysql.Select(sql, "Master_Employee", (err, result) => {
      if (err) console.log("Error", err);

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

router.get("/totaladmin", (req, res) => {
  try {
    let sql = `SELECT
   me_profile_pic AS profilePicturePath,
   me_id AS newEmployeeId,
   CONCAT(me_lastname, ' ', me_firstname) AS firstname,
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
WHERE
   me_department = '1'
   and  me_jobstatus IN ('regular', 'probitionary');`;

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

router.get("/totalIT", (req, res) => {
  try {
    let sql = `SELECT
   me_profile_pic AS profilePicturePath,
   me_id AS newEmployeeId,
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
   WHERE
   me_department = '2'
   and  me_jobstatus IN ('regular', 'probitionary');`;

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

router.get("/totalcabling", (req, res) => {
  try {
    let sql = `SELECT
   me_profile_pic AS profilePicturePath,
   me_id AS newEmployeeId,
   CONCAT(me_lastname, ' ', me_firstname) AS firstname,
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
   WHERE
   me_department = '3'
   and  me_jobstatus IN ('regular', 'probitionary')`;

    mysql
      .mysqlQueryPromise(sql)
      .then((result) => {
        res.json({
          msg: "success",
          data: result || [],
        });
      })
      .catch((error) => {
        console.error("Error executing SQL query:", error);
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

router.get("/totalcandidate", (req, res) => {
  try {
    let sql = ` SELECT
    me_profile_pic as profilePicturePath,
    me_id as newEmployeeId,
    CONCAT(master_employee.me_lastname, " ", master_employee.me_firstname) AS firstname,
    md_departmentname AS department,
    me_hiredate as hiredate,
    mp_positionname AS position,
    CONCAT(
      TIMESTAMPDIFF(YEAR, me_hiredate, CURRENT_DATE), ' Years ',
      TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) % 12, ' Months ',
      DATEDIFF(CURRENT_DATE, DATE_ADD(me_hiredate, INTERVAL TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) MONTH)), ' Days'
  ) AS tenure
FROM
    master_employee
LEFT JOIN
    master_department md ON master_employee.me_department = md_departmentid
LEFT JOIN
    master_position ON master_employee.me_position = mp_positionid
WHERE
    me_jobstatus = 'probitionary'
    AND TIMESTAMPDIFF(MONTH, me_hiredate, CURDATE()) >= 5`;

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

router.get("/totalbagapuroapi", (req, res) => {
  try {
    let sql = ` SELECT
    me_profile_pic as profilePicturePath,
    me_id as newEmployeeId,
    CONCAT(master_employee.me_lastname, " ", master_employee.me_firstname) AS firstname,
    md_departmentname AS department,
    me_hiredate as hiredate,
    mp_positionname AS position,
    CONCAT(
      TIMESTAMPDIFF(YEAR, me_hiredate, CURRENT_DATE), ' Years ',
      TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) % 12, ' Months ',
      DATEDIFF(CURRENT_DATE, DATE_ADD(me_hiredate, INTERVAL TIMESTAMPDIFF(MONTH, me_hiredate, CURRENT_DATE) MONTH)), ' Days'
  ) AS tenure
FROM
    master_employee
LEFT JOIN
    master_department md ON master_employee.me_department = md_departmentid
LEFT JOIN
    master_position ON master_employee.me_position = mp_positionid
WHERE
     UPPER(me_firstname) = 'BAGAPURO' OR UPPER(me_lastname) = 'BAGAPURO'`;

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

router.get("/total1yearemployee", (req, res) => {
  try {
    let sql = `select
    newEmployeeId,
    firstname,
    department,
    hiredate,
    position,
    contact,
    tenure
    from (
    SELECT 
       me_id AS newEmployeeId,
       CONCAT(me_firstname, ' ', me_lastname) AS firstname,
       md_departmentname AS department,
       me_hiredate AS hiredate,
       mp_positionname AS position,
       me_phone AS contact,
       CONCAT(
           TIMESTAMPDIFF(YEAR, me_hiredate, CURRENT_DATE), ' Years '
       ) AS tenure
       FROM 
       master_employee
       LEFT JOIN 
       master_department md ON master_employee.me_department = md_departmentid
       LEFT JOIN 
       master_position ON master_employee.me_position = mp_positionid
       where me_jobstatus in ('regular')) as result
       where tenure = '1 Years '`;

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

router.get("/apprenticemodal", (req, res) => {
  try {
    let sql = `select
    me_id, 
    me_profile_pic,
    concat(me_lastname,' ',me_firstname) as me_firstname,
    md_departmentname as me_department,
    me_hiredate,
    mp_positionname as me_position
    from master_employee
    inner join master_department on master_employee.me_department = md_departmentid
    inner join master_position on master_employee.me_position = mp_positionid
    where me_jobstatus = 'apprentice'`;

    mysql.Select(sql, "Master_Employee", (err, result) => {
      if (err) console.error("Error :", err);

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

//#endregion

//#region ADMIN NOTIFICATION

router.post("/viewnotif", (req, res) => {
  try {
    let notificationIdClicked = req.body.notificationIdClicked;
    let sql = `select *
    from admin_notification
    where an_notificationid = '${notificationIdClicked}'`;

    mysql.Select(sql, "Admin_Notification", (err, result) => {
      if (err) console.error("Error : ", err);

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

router.get("/loadnotif", (req, res) => {
  try {
    let sql = `SELECT * FROM admin_notification
    WHERE an_isDeleate = 'NO'
    ORDER BY an_date DESC`;

    mysql.Select(sql, "Admin_Notification", (err, result) => {
      if (err) console.error("Error: ", err);

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

router.post("/markread", (req, res) => {
  try {
    let notificationId = req.body.notificationId;
    let sql = `SELECT
    an_isRead 
    FROM admin_notification
    WHERE an_isDeleate = 'NO'
    AND an_notificationid = '${notificationId}'
    ORDER BY an_date DESC`;

    mysql.Select(sql, "Admin_Notification", (err, result) => {
      if (err) {
        console.error("Error: ", err);
        res.json({
          msg: "error",
          data: err,
        });
        return;
      }

      if (result.length > 0) {
        const isread = result[0].isread;
        res.json({
          msg: "success",
          data: {
            isread: isread,
          },
        });
      } else {
        res.json({
          msg: "error",
          data: "Notification not found",
        });
      }
    });
  } catch (error) {
    console.error("Error: ", error);
    res.json({
      msg: "error",
      data: error,
    });
  }
});

router.get("/countunreadbadge", (req, res) => {
  try {
    let sql = `    
    SELECT count(*) AS Unreadcount
    FROM admin_notification 
    WHERE an_isReceived = 'NO'
    AND an_isRead = 'NO'
    AND an_isDeleate = 'NO'`;

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

router.post("/readnotif", (req, res) => {
  try {
    let notificationId = req.body.notificationId;
    let sql = `UPDATE admin_notification SET 
    an_isReceived = 'YES',
    an_isRead = 'YES'
    WHERE an_notificationid = '${notificationId}'`;

    mysql
      .Update(sql)
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

router.post("/deleatenotif", (req, res) => {
  try {
    let notificationId = req.body.notificationId;
    let sql = `UPDATE admin_notification SET 
    an_isReceived = 'YES',
    an_isRead = 'YES',
    an_isDeleate = 'YES'
    WHERE an_notificationid = '${notificationId}'`;

    mysql
      .Update(sql)
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

//#endregion

//#region TOPBAR SEARCH EMPLOYEE

router.post("/searchemployee", (req, res) => {
  try {
    const { search } = req.body;

    let sql = `
    SELECT me_id, me_firstname, me_lastname, me_profile_pic
    FROM master_employee
    WHERE CONCAT(me_id, ' ', me_firstname, ' ', me_lastname) LIKE '%${search}%'
    LIMIT 10`;

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
      data: error.message,
    });
  }
});

//#endregion

//#region MISSLOGS
router.get("/loadmisslogs", (req, res) => {
  try {
    const first_day_of_month = GetCurrentMonthFirstDay();
    const last_day_of_month = GetCurrentMonthLastDay();
    const duration = 22;
    let sql = SelectStatement(
      `select 
      ma_attendanceid,
      ma_employeeid,
      concat(me_lastname,' ',me_firstname) as ma_fullname,
      ma_attendancedate,
      REPLACE(REPLACE(ma_clockin, 'T', ' '), 'Z', '') as ma_clockin,
      ma_locationIn,
      ma_devicein,
      REPLACE(REPLACE(ma_clockout, 'T', ' '), 'Z', '') as ma_clockout,
      ma_locationOut,
      ma_deviceout
      from master_attendance
      inner join master_employee on ma_employeeid = me_id
      where timestampdiff(HOUR, ma_clockin, ma_clockout) > ?
      and ma_attendancedate between ? and ?
      order by ma_attendancedate desc`,
      [duration, `${first_day_of_month}`, `${last_day_of_month}`]
    );

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({
          msg: err,
        });
        return;
      }

      if (result != 0) {
        let data = DataModeling(result, "ma_");
        res.status(200).json({
          msg: "success",
          data: data,
        });
      } else {
        res.status(200).json({
          msg: "success",
          data: result,
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      msg: error,
    });
  }
});

router.post("/getmislog", (req, res) => {
  try {
    const { startdate, enddate } = req.body;
    let departmentid = req.session.departmentid;
    console.log(startdate, enddate);

    const duration = 24;
    let sql = SelectStatement(
      `select 
      ma_attendanceid,
      ma_employeeid,
      concat(me_lastname,' ',me_firstname) as ma_fullname,
      ma_attendancedate,
      REPLACE(REPLACE(ma_clockin, 'T', ' '), 'Z', '') as ma_clockin,
      ma_locationIn,
      ma_devicein,
      REPLACE(REPLACE(ma_clockout, 'T', ' '), 'Z', '') as ma_clockout,
      ma_locationOut,
      ma_deviceout
      from master_attendance
      inner join master_employee on ma_employeeid = me_id
      where timestampdiff(HOUR, ma_clockin, ma_clockout) > ? 
      and ma_attendancedate between ? and ?
      and me_department = ?
      order by ma_attendancedate desc`,
      [
        duration,
        `${ConvertToDate(startdate)}`,
        `${ConvertToDate(enddate)}`,
        departmentid,
      ]
    );

    Select(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({
          msg: err,
        });
        return;
      }

      if (result != 0) {
        let data = DataModeling(result, "ma_");
        res.status(200).json({
          msg: "success",
          data: data,
        });
      } else {
        res.status(200).json({
          msg: "success",
          data: result,
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      msg: error,
    });
  }
});
//#endregion

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
